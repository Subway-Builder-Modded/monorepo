package main

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"sync"
	"time"
)

// appImageMount holds a live --appimage-mount subprocess and its mount path. It is reused across GetGameVersion calls and only re-mounted when the AppImage file's mtime changes.
type appImageMount struct {
	mu         sync.Mutex
	cmd        *exec.Cmd
	mountPath  string
	sourcePath string
	mtime      time.Time
	// commandFor builds the mount command. nil uses the real AppImage --appimage-mount flag.
	// Override in tests to avoid requiring a real AppImage binary.
	commandFor func(exePath string) *exec.Cmd
}

// isAppImagePath reports whether path points to a Linux AppImage executable.
func isAppImagePath(path string) bool {
	return runtime.GOOS == "linux" && strings.HasSuffix(strings.ToLower(path), ".appimage")
}

// ensureMounted returns the mount path for exePath.
func (m *appImageMount) ensureMounted(exePath string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	info, err := os.Stat(exePath)
	if err != nil {
		return "", fmt.Errorf("stat AppImage: %w", err)
	}
	mtime := info.ModTime()

	// Reuse the live mount if the file hasn't changed.
	if m.cmd != nil && m.sourcePath == exePath && m.mtime.Equal(mtime) {
		return m.mountPath, nil
	}

	// Tear down any stale mount before starting a new one.
	m.teardownLocked()

	buildCmd := m.commandFor
	if buildCmd == nil {
		buildCmd = func(p string) *exec.Cmd { return exec.Command(p, "--appimage-mount") }
	}
	cmd := buildCmd(exePath)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return "", fmt.Errorf("pipe AppImage stdout: %w", err)
	}
	if err := cmd.Start(); err != nil {
		return "", fmt.Errorf("start AppImage mount: %w", err)
	}

	// --appimage-mount prints the mount path as its first (and only) stdout line, then blocks until killed.
	scanner := bufio.NewScanner(stdout)
	if !scanner.Scan() {
		_ = cmd.Process.Kill()
		return "", fmt.Errorf("AppImage --appimage-mount produced no output")
	}
	mountPath := strings.TrimSpace(scanner.Text())
	if mountPath == "" {
		_ = cmd.Process.Kill()
		return "", fmt.Errorf("AppImage --appimage-mount returned empty path")
	}

	m.cmd = cmd
	m.mountPath = mountPath
	m.sourcePath = exePath
	m.mtime = mtime
	return mountPath, nil
}

// teardown tears down the mount, if any, and resets the state of the appImageMount.
func (m *appImageMount) teardown() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.teardownLocked()
}

// teardownLocked tears down the mount without acquiring the mutex.
func (m *appImageMount) teardownLocked() {
	if m.cmd == nil {
		return
	}
	if m.cmd.Process != nil {
		_ = m.cmd.Process.Kill()
		_ = m.cmd.Wait()
	}
	m.cmd = nil
	m.mountPath = ""
	m.sourcePath = ""
	m.mtime = time.Time{}
}
