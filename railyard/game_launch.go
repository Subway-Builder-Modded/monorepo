package main

// This file defines functions that manage launch lifecycle: the Wails-facing LaunchGame/StopGame/IsGameRunning methods
// and the session bookkeeping around them.

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"railyard/internal/constants"
	"railyard/internal/types"
)

func (a *App) LaunchGame(skipIncompatibleMaps bool) types.GenericResponse {
	a.gameMu.Lock()
	if a.gameStarting {
		a.gameMu.Unlock()
		return types.ErrorResponse("game is already starting")
	}
	if a.gameCmd != nil && a.gameCmd.ProcessState == nil {
		a.gameMu.Unlock()
		return types.ErrorResponse("game is already running")
	}
	// The session holds the exclusivity gate from here until the game exits, covering mod
	// generation and launch; content operations cannot start or be in flight underneath it.
	sessionToken, gateErr := a.contentGate.BeginGameSession()
	if gateErr != nil {
		a.gameMu.Unlock()
		return types.ErrorResponse(fmt.Sprintf("cannot launch the game: %v", gateErr))
	}
	a.gameStarting = true
	a.gameMu.Unlock()

	started := false
	defer func() {
		if started {
			return
		}
		a.gameMu.Lock()
		a.gameStarting = false
		a.gameMu.Unlock()
		a.contentGate.EndGameSession(sessionToken)
		a.emitEvent("game:status", "stopped")
	}()

	a.emitEvent("game:status", "starting")
	if a.launchGameTestReady != nil {
		select {
		case a.launchGameTestReady <- struct{}{}:
		default:
		}
	}
	if a.launchGameTestBlock != nil {
		<-a.launchGameTestBlock
	}

	cfg := a.Config.GetConfig()
	if !cfg.Validation.GameSourceValid {
		return types.ErrorResponse("game executable path is not configured or invalid")
	}

	extraSplitArgs := []string{}

	profile := a.Profiles.GetActiveProfile()
	if profile.Status != types.ResponseSuccess {
		a.Logger.Warn("Failed to get active profile for command line args on game launch", "status", profile.Status, "message", profile.Message)
	} else {
		if profile.Profile.SystemPreferences.ExtraHeapSize > 0 {
			extraSplitArgs = append(extraSplitArgs, fmt.Sprintf(`--js-flags="--max-old-space-size=%d"`, profile.Profile.SystemPreferences.ExtraHeapSize))
		}
	}

	port, err := a.startPMTilesServer()
	if err != nil {
		a.Logger.Warn("Failed to start PMTiles server", "error", err)
		return types.ErrorResponse(err.Error())
	}

	a.emitEvent("server:port", port)
	a.Logger.Info(fmt.Sprintf("Debug thumbnails: http://127.0.0.1:%d/debug/thumbnails", port))

	a.generateMissingThumbnails(port)

	if err := a.generateMod(port, skipIncompatibleMaps); err != nil {
		a.Logger.Warn("Failed to generate mod", "error", err)
		return types.ErrorResponse(err.Error())
	}

	exePath := strings.TrimPrefix(cfg.Config.ExecutablePath, "/run/host") // Fix the paths when calling outside of sandbox
	a.Logger.Info("Launching game", "path", exePath)

	spec := launchSpec{
		useSteam:          cfg.Config.UseSteamLaunch,
		exePath:           exePath,
		extraArgs:         extraSplitArgs,
		useDevTools:       profile.Status == types.ResponseSuccess && profile.Profile.SystemPreferences.UseDevTools,
		chromeSandboxPath: a.Config.Cfg.ChromeSandboxPath,
	}
	if runtime.GOOS == "linux" && !spec.useSteam {
		if _, lookPathErr := exec.LookPath("flatpak-spawn"); lookPathErr == nil {
			spec.flatpakSpawnAvailable = true
		} else {
			a.Logger.Warn("flatpak-spawn not available; falling back to direct executable launch", "error", lookPathErr)
		}
	}
	cmd := buildLaunchCommand(runtime.GOOS, spec)

	a.Logger.Info("Executing launch command", "cmd", cmd.Path, "args", cmd.Args, "dir", cmd.Dir)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return types.ErrorResponse(fmt.Sprintf("failed to create stdout pipe: %v", err))
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return types.ErrorResponse(fmt.Sprintf("failed to create stderr pipe: %v", err))
	}

	if err := cmd.Start(); err != nil {
		a.Logger.Error("Failed to launch game", err)
		return types.ErrorResponse(fmt.Sprintf("failed to launch game: %v", err))
	}

	// Steam launches only start the URL handler; discover the true game process.
	if spec.useSteam {
		deadline := time.Now().Add(steamLaunchDiscoveryTimeout)
		found := pollSteamGameProcess(steamProcessLookup(runtime.GOOS, a.Logger), deadline, a.Logger)
		if found == nil {
			return types.ErrorResponse("could not find the Steam-launched game process; the launch may have been cancelled")
		}
		cmd = found
	}

	a.gameMu.Lock()
	a.gameCmd = cmd
	a.gameStarting = false
	a.gameMu.Unlock()
	started = true

	a.emitEvent("game:status", "running")

	if !spec.useSteam {
		a.emitEvent("game:log", map[string]string{
			"stream": "stdout",
			"line":   fmt.Sprintf("> %s %s", strings.Split(cmd.Path, string(os.PathSeparator))[len(strings.Split(cmd.Path, string(os.PathSeparator)))-1], strings.Join(cmd.Args[1:], " ")),
		})
	} else {
		a.emitEvent("game:log", map[string]string{
			"stream": "stdout",
			"line":   fmt.Sprintf("> %s %s", constants.STEAM_URL, "(cannot get logs when using Steam launch)"),
		})
	}

	// Stream stdout/stderr to frontend
	go a.streamGameOutput(stdout, "stdout")
	go a.streamGameOutput(stderr, "stderr")

	// Wait for process exit in background
	go func() {
		err := waitForGameExit(runtime.GOOS, spec.useSteam, cmd, a.Logger)
		a.gameMu.Lock()
		a.gameCmd = nil
		a.gameStarting = false
		a.gameMu.Unlock()
		a.contentGate.EndGameSession(sessionToken)

		exitCode := 0
		if err != nil {
			if exitErr, ok := err.(*exec.ExitError); ok {
				exitCode = exitErr.ExitCode()
			}
			a.Logger.Warn("Game exited with error", "error", err)
		} else {
			a.Logger.Info("Game exited normally")
		}
		a.emitEvent("game:exit", exitCode)
		a.emitEvent("game:status", "stopped")
	}()

	return types.SuccessResponse("Game launched")
}

func (a *App) streamGameOutput(r io.Reader, stream string) {
	scanner := bufio.NewScanner(r)
	for scanner.Scan() {
		line := scanner.Text()
		a.emitEvent("game:log", map[string]string{
			"stream": stream,
			"line":   line,
		})
	}
}

func (a *App) IsGameRunning() types.GameRunningResponse {
	a.gameMu.Lock()
	defer a.gameMu.Unlock()
	return types.GameRunningResponse{
		GenericResponse: types.SuccessResponse("Game running status resolved"),
		Running:         a.gameCmd != nil && a.gameCmd.ProcessState == nil,
	}
}

func (a *App) StopGame() types.GenericResponse {
	a.Logger.Info("Killing game process")
	a.gameMu.Lock()
	cmd := a.gameCmd
	starting := a.gameStarting
	a.gameMu.Unlock()

	if starting && cmd == nil {
		a.Logger.Warn("Game is still starting and cannot be stopped yet")
		return types.ErrorResponse("game is still starting")
	}

	if cmd == nil || cmd.ProcessState != nil {
		a.Logger.Warn("No game process to kill")
		return types.ErrorResponse("game is not running")
	}

	if a.pmtilesServer != nil {
		a.Logger.Info("Shutting down PMTiles server")
		a.pmtilesServer.Close()
	}

	if err := cmd.Process.Kill(); err != nil {
		if a.Config.Cfg.UseSteamLaunch && runtime.GOOS == "linux" {
			// The game runs on the host outside the Flatpak sandbox, so signal it via pkill.
			command := exec.Command("flatpak-spawn", "--host", "pkill", "-9", linuxGameProcessName)
			if err := command.Run(); err != nil {
				a.Logger.Warn("Failed to kill Steam-launched game process on Linux", "error", err)
				return types.ErrorResponse(fmt.Sprintf("failed to stop game: %v", err))
			}
		} else {
			a.Logger.Warn("Failed to kill game process", "error", err)
			return types.ErrorResponse(fmt.Sprintf("failed to stop game: %v", err))
		}
	}

	a.Logger.Info("Game process killed successfully")
	a.gameMu.Lock()
	a.gameCmd = nil
	a.gameStarting = false
	a.gameMu.Unlock()
	return types.SuccessResponse("Game stopped")
}
