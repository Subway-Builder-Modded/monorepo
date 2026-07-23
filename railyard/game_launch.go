package main

// This file defines functions that manage launch lifecycle: the Wails-facing LaunchGame/StopGame/IsGameRunning methods
// and the session bookkeeping around them.

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"runtime"
	"strings"

	"railyard/internal/constants"
	"railyard/internal/types"
)

// launchErr wraps a GenericResponse error as a GameLaunchResponse. The launch-blocked / gave-up
// outcomes are delivered via events (the discovery watcher is async), not this return value.
func launchErr(msg string) types.GameLaunchResponse {
	return types.GameLaunchResponse{GenericResponse: types.ErrorResponse(msg)}
}

func (a *App) LaunchGame(skipIncompatibleMaps bool) types.GameLaunchResponse {
	a.gameMu.Lock()
	if a.gameStarting || a.gameDiscovering {
		a.gameMu.Unlock()
		return launchErr("game is already starting")
	}
	if a.gameCmd != nil && a.gameCmd.ProcessState == nil {
		a.gameMu.Unlock()
		return launchErr("game is already running")
	}
	// The session holds the exclusivity gate from here until the game exits, covering mod
	// generation and launch; content operations cannot start or be in flight underneath it.
	sessionToken, gateErr := a.contentGate.BeginGameSession()
	if gateErr != nil {
		a.gameMu.Unlock()
		return launchErr(fmt.Sprintf("cannot launch the game: %v", gateErr))
	}
	a.gameStarting = true
	// A per-launch generation, so a cancelled launch's kill-on-sight grace never targets a newer one.
	a.gameLaunchGen++
	gen := a.gameLaunchGen
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
		return launchErr("game executable path is not configured or invalid")
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
		return launchErr(err.Error())
	}

	a.emitEvent("server:port", port)
	a.Logger.Info(fmt.Sprintf("Debug thumbnails: http://127.0.0.1:%d/debug/thumbnails", port))

	a.generateMissingThumbnails(port)

	if err := a.generateMod(port, skipIncompatibleMaps); err != nil {
		a.Logger.Warn("Failed to generate mod", "error", err)
		return launchErr(err.Error())
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
		return launchErr(fmt.Sprintf("failed to create stdout pipe: %v", err))
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return launchErr(fmt.Sprintf("failed to create stderr pipe: %v", err))
	}

	if err := cmd.Start(); err != nil {
		a.Logger.Error("Failed to launch game", err)
		return launchErr(fmt.Sprintf("failed to launch game: %v", err))
	}

	// Steam launches only start the URL handler; the real game process is discovered in the
	// background. Hand the session off to the discovery watcher and return - it emits "running"
	// when the game appears, or the launch-blocked / gave-up events otherwise. The user can abort
	// the wait via StopGame, which cancels this context.
	if spec.useSteam {
		ctx, cancel := context.WithCancel(context.Background())
		a.gameMu.Lock()
		a.gameStarting = false
		a.gameDiscovering = true
		a.gameLaunchCancel = cancel
		a.gameMu.Unlock()
		started = true // the discovery watcher owns the session from here

		a.emitEvent("game:log", map[string]string{
			"stream": "stdout",
			"line":   fmt.Sprintf("> %s %s", constants.STEAM_URL, "(discovering Steam-launched game...)"),
		})
		go a.runSteamDiscovery(ctx, sessionToken, gen, spec)
		return types.GameLaunchResponse{GenericResponse: types.SuccessResponse("Steam launch initiated")}
	}

	// Vanilla launch: cmd is the game process itself, so it is running immediately.
	a.gameMu.Lock()
	a.gameCmd = cmd
	a.gameStarting = false
	a.gameMu.Unlock()
	started = true

	a.emitEvent("game:status", "running")
	a.emitEvent("game:log", map[string]string{
		"stream": "stdout",
		"line":   fmt.Sprintf("> %s %s", strings.Split(cmd.Path, string(os.PathSeparator))[len(strings.Split(cmd.Path, string(os.PathSeparator)))-1], strings.Join(cmd.Args[1:], " ")),
	})

	go a.streamGameOutput(stdout, "stdout")
	go a.streamGameOutput(stderr, "stderr")
	go a.watchGameExit(sessionToken, cmd, false)

	return types.GameLaunchResponse{GenericResponse: types.SuccessResponse("Game launched")}
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
	a.gameMu.Lock()
	cmd := a.gameCmd
	starting := a.gameStarting
	discovering := a.gameDiscovering
	cancel := a.gameLaunchCancel
	a.gameMu.Unlock()

	// Abort an in-flight Steam discovery: the game hasn't been found yet, so cancel the watcher.
	// It releases the session, emits "stopped", and kills the game if it still appears (grace).
	if discovering {
		a.Logger.Info("Cancelling in-flight Steam launch discovery")
		if cancel != nil {
			cancel()
		}
		return types.SuccessResponse("Launch cancelled")
	}

	a.Logger.Info("Killing game process")
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

	// Kill the whole process tree so Electron's renderer children can't survive and leave a ghost
	// window behind.
	if err := killGameProcessTree(cmd.Process.Pid, runtime.GOOS, a.Config.Cfg.UseSteamLaunch, a.Logger); err != nil {
		a.Logger.Warn("Failed to kill game process", "error", err)
		return types.ErrorResponse(fmt.Sprintf("failed to stop game: %v", err))
	}

	a.Logger.Info("Game process killed successfully")
	a.gameMu.Lock()
	a.gameCmd = nil
	a.gameStarting = false
	a.gameMu.Unlock()
	return types.SuccessResponse("Game stopped")
}
