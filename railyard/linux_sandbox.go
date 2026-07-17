package main

// This file defines Linux Chrome sandbox installation for AppImage launches: extracting
// chrome-sandbox from the game AppImage and installing it setuid-root via pkexec.

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path"
	"runtime"

	"railyard/internal/types"
)

// sandboxExtractCommand returns the command that extracts chrome-sandbox from the game
// AppImage into /tmp/squashfs-root.
func sandboxExtractCommand(executablePath string) *exec.Cmd {
	cmd := exec.Command(executablePath, "--appimage-extract", "chrome-sandbox")
	cmd.Dir = "/tmp"
	return cmd
}

// sandboxInstallCommand returns the pkexec command that installs the extracted sandbox
// binary setuid-root, routed through flatpak-spawn when running inside the Flatpak sandbox.
func sandboxInstallCommand(flatpakSpawnAvailable bool, sandboxPath, destPath string) *exec.Cmd {
	args := []string{"pkexec", "install", "-o", "root", "-g", "root", "-m", "4755", sandboxPath, destPath}
	if flatpakSpawnAvailable {
		return exec.Command("flatpak-spawn", append([]string{"--host"}, args...)...)
	}
	return exec.Command(args[0], args[1:]...)
}

func (a *App) InstallLinuxSandbox() types.GenericResponse {
	a.Logger.Info("Installing Linux sandbox")
	if runtime.GOOS != "linux" {
		panic("InstallLinuxSandbox shouldn't be possible to call on a non-linux platform")
	}

	if a.Config.Cfg.ExecutablePath == "" {
		a.Logger.Warn("Game executable path is not configured, stopping.")
		return types.ErrorResponse("game executable path is not configured")
	}

	if err := sandboxExtractCommand(a.Config.Cfg.ExecutablePath).Run(); err != nil {
		a.Logger.Error("Failed to extract chrome-sandbox from the game AppImage", err)
		return types.ErrorResponse(fmt.Sprintf("failed to extract chrome-sandbox: %v", err))
	}

	sandboxPath := path.Join("/tmp", "squashfs-root", "chrome-sandbox")
	if _, err := os.Stat(sandboxPath); errors.Is(err, fs.ErrNotExist) {
		a.Logger.Error("Extracted chrome-sandbox not found at expected path", err)
		return types.ErrorResponse(fmt.Sprintf("extracted chrome-sandbox not found at expected path: %s", sandboxPath))
	}

	destPath := path.Join("/usr", "local", "bin", "chrome-sb-sandbox")
	_, flatpakSpawnErr := exec.LookPath("flatpak-spawn")
	if err := sandboxInstallCommand(flatpakSpawnErr == nil, sandboxPath, destPath).Run(); err != nil {
		a.Logger.Error("Failed to install chrome-sandbox with pkexec", err)
		return types.ErrorResponse(fmt.Sprintf("failed to install chrome-sandbox with pkexec: %v", err))
	}

	// Persisted so the installed sandbox survives an app restart.
	if _, err := a.Config.UpdateConfig(func(cfg *types.AppConfig) {
		cfg.ChromeSandboxPath = destPath
	}, true); err != nil {
		a.Logger.Error("Failed to persist chrome-sandbox path", err)
		return types.ErrorResponse(fmt.Sprintf("failed to persist chrome-sandbox path: %v", err))
	}
	return types.SuccessResponse("Linux sandbox installed")
}

func (a *App) SandboxIsInstalled() types.SandboxStatusResponse {
	installed := false
	if runtime.GOOS == "linux" && a.Config.Cfg.ChromeSandboxPath != "" {
		if _, err := os.Stat(a.Config.Cfg.ChromeSandboxPath); !errors.Is(err, fs.ErrNotExist) {
			installed = true
		}
	}

	return types.SandboxStatusResponse{
		GenericResponse: types.SuccessResponse("Sandbox status resolved"),
		Installed:       installed,
	}
}
