package main

// This file contains platform-specific game launch logic, including:
//  - command construction,
//  - Steam process discovery,
//  - exit detection
// This covers all six launch paths (darwin/linux/windows x native/Steam).
// Helpers take goos as a parameter so every path is unit-testable on any host.

import (
	"errors"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"

	"railyard/internal/constants"
	"railyard/internal/logger"

	"github.com/mitchellh/go-ps"
)

// Steam launches return before the game starts, so the real game process is discovered by
// polling; discovery is bounded so a cancelled Steam prompt cannot hang the launch.
const (
	steamPollInterval = time.Second
	// Time after launch to raise the launch-blocked dialog; the watcher keeps polling after.
	steamDiscoverySurfaceDelay = 10 * time.Second
	// Time after launch when discovery gives up entirely.
	steamLaunchDiscoveryTimeout = 1 * time.Minute
	// Time after a cancel we keep killing a game that still appears.
	steamCancelKillGrace = 10 * time.Second
)

// Process names of the Steam-launched game binary per OS (macOS uses constants.GameMacProcessName).
const (
	linuxGameProcessName   = "metro-maker4"
	windowsGameProcessName = "game.exe"
)

// launchSpec carries the per-launch inputs that vary by configuration. buildLaunchCommand is
// deterministic given a spec: host-dependent facts (flatpak-spawn availability) are resolved
// by the caller.
type launchSpec struct {
	useSteam              bool
	exePath               string
	extraArgs             []string
	useDevTools           bool
	chromeSandboxPath     string
	flatpakSpawnAvailable bool
}

// buildLaunchCommand constructs the launch command for goos.
func buildLaunchCommand(goos string, spec launchSpec) *exec.Cmd {
	if spec.useSteam {
		return steamLaunchCommand(goos)
	}
	return nativeLaunchCommand(goos, spec)
}

// steamLaunchCommand hands the steam:// URL to the OS URL handler, which returns immediately;
// the real game process is discovered afterwards via pollSteamGameProcess.
// Launching through Steam preserves the Steam overlay and launch context.
func steamLaunchCommand(goos string) *exec.Cmd {
	switch goos {
	case "darwin":
		return exec.Command("open", constants.STEAM_URL)
	case "linux":
		return exec.Command("xdg-open", constants.STEAM_URL)
	default:
		return exec.Command("cmd", "/C", "start", constants.STEAM_URL)
	}
}

// nativeLaunchCommand launches the configured executable directly.
func nativeLaunchCommand(goos string, spec launchSpec) *exec.Cmd {
	switch {
	case goos == "darwin" && isMacAppBundlePath(spec.exePath):
		// Resolve the .app bundle to the inner executable and launch via shell to handle
		// Electron stub executables that lack valid magic bytes.
		innerExe := spec.exePath
		if strings.HasSuffix(spec.exePath, ".app") {
			innerExe = resolveMacBundleExecutable(spec.exePath)
		}
		args := []string{"-c", `ELECTRON_ENABLE_LOGGING=1 exec "$0" "$@"`, innerExe}
		args = append(args, spec.extraArgs...)
		return withDevToolsEnv(exec.Command("/bin/sh", args...), spec.useDevTools)
	case goos == "linux" && spec.flatpakSpawnAvailable:
		// Prefer host launch via flatpak-spawn; env goes through --env because that is how
		// flatpak-spawn forwards it to the host process.
		if spec.chromeSandboxPath != "" {
			// Ensure sandbox is used if available to avoid permission issues in Flatpak environments
			args := []string{"--env=CHROME_DEVEL_SANDBOX=" + spec.chromeSandboxPath}
			if spec.useDevTools {
				args = append(args, "--env=DEBUG_PROD=TRUE")
			}
			args = append(args, "--host", spec.exePath)
			args = append(args, spec.extraArgs...)
			return exec.Command("flatpak-spawn", args...)
		}
		args := []string{"--host", spec.exePath, "--no-sandbox"}
		args = append(args, spec.extraArgs...)
		return exec.Command("flatpak-spawn", args...)
	default:
		// Direct launch: Windows, non-bundle macOS paths, and Linux without flatpak-spawn.
		cmd := exec.Command(spec.exePath, spec.extraArgs...)
		cmd.Dir = filepath.Dir(spec.exePath)
		return withDevToolsEnv(cmd, spec.useDevTools)
	}
}

// resolveMacBundleExecutable resolves a .app bundle to the binary inside Contents/MacOS.
// Renaming the bundle directory does not rename the inner binary (that name comes from
// Info.plist CFBundleExecutable), so the basename-derived candidate is only tried first;
// a renamed bundle is resolved via the game's canonical binary name, then via a
// single-file scan of Contents/MacOS. Falls back to the derived path so a broken bundle
// surfaces the usual launch error.
func resolveMacBundleExecutable(bundlePath string) string {
	macOSDir := path.Join(bundlePath, "Contents", "MacOS")
	derived := path.Join(macOSDir, strings.TrimSuffix(path.Base(bundlePath), ".app"))
	if isRegularFile(derived) {
		return derived
	}
	if canonical := path.Join(macOSDir, constants.GameMacProcessName); isRegularFile(canonical) {
		return canonical
	}
	if entries, err := os.ReadDir(macOSDir); err == nil {
		var files []string
		for _, entry := range entries {
			if !entry.IsDir() {
				files = append(files, entry.Name())
			}
		}
		if len(files) == 1 {
			return path.Join(macOSDir, files[0])
		}
	}
	return derived
}

// isRegularFile reports whether p exists and is not a directory.
func isRegularFile(p string) bool {
	info, err := os.Stat(p)
	return err == nil && !info.IsDir()
}

// isMacAppBundlePath reports whether the path points at or inside a macOS .app bundle.
func isMacAppBundlePath(exePath string) bool {
	return strings.HasSuffix(exePath, ".app") || strings.Contains(exePath, ".app/")
}

// withDevToolsEnv injects the DevTools env flag when enabled.
func withDevToolsEnv(cmd *exec.Cmd, useDevTools bool) *exec.Cmd {
	if useDevTools {
		cmd.Env = append(os.Environ(), "DEBUG_PROD=TRUE")
	}
	return cmd
}

// pollSteamGameProcess polls lookup once per steamPollInterval until it finds the game process
func pollSteamGameProcess(lookup func() (*os.Process, error), deadline time.Time, log logger.Logger) *exec.Cmd {
	if lookup == nil {
		return nil
	}
	for time.Now().Before(deadline) {
		proc, err := lookup()
		// Return nil on lookup hard failures.
		if err != nil {
			log.Warn("Failed to list processes while waiting for Steam-launched game", "error", err)
			return nil
		}
		if proc != nil {
			log.Info("Found Steam-launched game process", "pid", proc.Pid)
			return &exec.Cmd{Process: proc}
		}
		time.Sleep(steamPollInterval)
	}
	// Return nil when discovery fails.
	return nil
}

// steamProcessLookup returns the per-OS scan for the Steam-launched game process.
func steamProcessLookup(goos string, log logger.Logger) func() (*os.Process, error) {
	switch goos {
	case "windows":
		return func() (*os.Process, error) {
			return windowsSteamProcessLookup(log)
		}
	case "linux":
		// The Flatpak sandbox hides host processes, so the scan runs through flatpak-spawn.
		return func() (*os.Process, error) {
			return steamProcessFromPgrep(exec.Command("flatpak-spawn", "--host", "pgrep", "-l", linuxGameProcessName), linuxSteamPIDFromLine, log)
		}
	case "darwin":
		return func() (*os.Process, error) {
			return steamProcessFromPgrep(exec.Command("pgrep", "-x", constants.GameMacProcessName), darwinSteamPIDFromLine, log)
		}
	}
	return nil
}

// windowsSteamProcessLookup scans the process table for the game executable, walking one
// parent level so the top-most game.exe instance is preferred when the game spawns children
// of the same name.
func windowsSteamProcessLookup(log logger.Logger) (*os.Process, error) {
	processes, err := ps.Processes()
	if err != nil {
		return nil, err
	}
	for _, proc := range processes {
		if proc.Executable() != windowsGameProcessName {
			continue
		}
		pid := proc.Pid()
		parent, err := ps.FindProcess(proc.PPid())
		if err != nil {
			log.Warn("Failed to find parent process while waiting for Steam-launched game", "error", err)
			continue
		}
		if parent != nil && parent.Executable() == windowsGameProcessName {
			pid = proc.PPid()
		}
		gameProcess, err := os.FindProcess(pid)
		if err != nil {
			log.Warn("Failed to find Steam-launched game process", "error", err)
			continue
		}
		return gameProcess, nil
	}
	return nil, nil
}

// Process names of the Steam client itself per OS, used to tell "Steam isn't running" apart
// from "Steam is running but the game never appeared" when discovery times out.
const (
	windowsSteamClientProcess = "steam.exe"
	linuxSteamClientProcess   = "steam"
	darwinSteamClientProcess  = "steam_osx"
)

// steamClientRunning reports whether the Steam client is running. Best-effort: a false result means
// no Steam process was found; any uncertainty returns true, so we never falsely claim Steam is down.
func steamClientRunning(goos string, log logger.Logger) bool {
	switch goos {
	case "windows":
		processes, err := ps.Processes()
		if err != nil {
			log.Warn("Failed to list processes for Steam client check", "error", err)
			return true
		}
		for _, proc := range processes {
			if strings.EqualFold(proc.Executable(), windowsSteamClientProcess) {
				return true
			}
		}
		return false
	case "darwin":
		return pgrepMatches(exec.Command("pgrep", "-x", darwinSteamClientProcess), log)
	case "linux":
		// The Flatpak sandbox hides host processes, so scan the host like the game lookup does.
		return pgrepMatches(exec.Command("flatpak-spawn", "--host", "pgrep", "-x", linuxSteamClientProcess), log)
	}
	return true
}

// pgrepMatches reports whether a pgrep-style command matched a process. Exit 1 is a clean no-match;
// any other error returns true, staying uncertain rather than claiming nothing is running.
func pgrepMatches(cmd *exec.Cmd, log logger.Logger) bool {
	err := cmd.Run()
	if err == nil {
		return true
	}
	var exitErr *exec.ExitError
	if errors.As(err, &exitErr) && exitErr.ExitCode() == 1 {
		return false
	}
	log.Warn("Steam client check command failed", "error", err)
	return true
}

// killGameProcessTree terminates the game process at pid together with its children.
func killGameProcessTree(pid int, goos string, useSteam bool, log logger.Logger) error {
	switch goos {
	case "windows":
		// The game is Electron (multi-process); killing only the main process orphans its renderer
		// children and can leave a "ghost" window . /T kills the whole tree and /F forces it since
		// a hung game won't honor a graceful close.
		out, err := exec.Command("taskkill", "/PID", strconv.Itoa(pid), "/T", "/F").CombinedOutput()
		if err != nil {
			log.Warn("taskkill failed", "pid", pid, "output", strings.TrimSpace(string(out)), "error", err)
		}
		return err
	case "linux":
		// The game runs on the host outside the Flatpak sandbox, so pkill it there for Steam launches.
		if useSteam {
			return exec.Command("flatpak-spawn", "--host", "pkill", "-9", linuxGameProcessName).Run()
		}
		if proc, err := os.FindProcess(pid); err == nil {
			return proc.Kill()
		}
		return nil
	default:
		if proc, err := os.FindProcess(pid); err == nil {
			return proc.Kill()
		}
		return nil
	}
}

// steamProcessFromPgrep runs a pgrep-style listing command and resolves the first line
// pidFromLine accepts.
func steamProcessFromPgrep(listCmd *exec.Cmd, pidFromLine func(string) (string, bool), log logger.Logger) (*os.Process, error) {
	output, err := listCmd.Output()
	if err != nil {
		var exitErr *exec.ExitError
		// pgrep exits 1 when nothing matches, which means we must keep polling.
		if errors.As(err, &exitErr) && exitErr.ExitCode() == 1 {
			return nil, nil
		}
		return nil, err
	}
	for _, line := range strings.Split(strings.TrimSpace(string(output)), "\n") {
		pidText, ok := pidFromLine(line)
		if !ok {
			continue
		}
		pid, err := strconv.Atoi(pidText)
		if err != nil {
			log.Warn("Failed to parse PID while waiting for Steam-launched game", "error", err, "line", line)
			continue
		}
		gameProcess, err := os.FindProcess(pid)
		if err != nil {
			log.Warn("Failed to find Steam-launched game process", "error", err)
			continue
		}
		return gameProcess, nil
	}
	return nil, nil
}

// linuxSteamPIDFromLine parses "pid name" lines from pgrep -l, accepting the game process.
func linuxSteamPIDFromLine(line string) (string, bool) {
	if !strings.HasSuffix(line, linuxGameProcessName) {
		return "", false
	}
	parts := strings.Split(line, " ")
	if len(parts) < 2 {
		return "", false
	}
	return parts[0], true
}

// darwinSteamPIDFromLine accepts bare-pid lines from pgrep -x.
func darwinSteamPIDFromLine(line string) (string, bool) {
	line = strings.TrimSpace(line)
	return line, line != ""
}

// waitForGameExit blocks until the game process exits. Steam-launched games are not children
// of the Railyard process on Linux/macOS, so wait(2) is unavailable and their exit is
// detected by polling instead.
func waitForGameExit(goos string, useSteam bool, cmd *exec.Cmd, log logger.Logger) error {
	switch {
	case useSteam && goos == "linux":
		log.Info("Waiting for Steam-launched game process to exit on Linux")
		for {
			output, err := exec.Command("flatpak-spawn", "--host", "pgrep", "-l", linuxGameProcessName).Output()
			if err != nil || len(output) == 0 {
				// Process not found, assume it has exited
				return nil
			}
			time.Sleep(steamPollInterval)
		}
	case useSteam && goos == "darwin":
		log.Info("Waiting for Steam-launched game process to exit on macOS")
		// Poll the discovered pid with signal 0 until it is gone.
		for cmd.Process.Signal(syscall.Signal(0)) == nil {
			time.Sleep(steamPollInterval)
		}
		return nil
	default:
		return cmd.Wait()
	}
}
