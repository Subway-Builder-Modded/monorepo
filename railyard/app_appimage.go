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

// appImageMount holds a live --appimage-mount subprocess and its squashfs
// mount path. It is reused across GetGameVersion calls and only re-mounted
// when the AppImage file's mtime changes (i.e. the game was updated on disk).
type appImageMount struct {
	mu         sync.Mutex
	cmd        *exec.Cmd
	mountPath  string
	sourcePath string
	mtime      time.Time
}

// isAppImagePath reports whether path points to a Linux AppImage executable.
func isAppImagePath(path string) bool {
	return runtime.GOOS == "linux" && strings.HasSuffix(strings.ToLower(path), ".appimage")
}

// ensureMounted returns the squashfs mount path for exePath, starting or
// reusing a --appimage-mount subprocess as needed. The subprocess stays alive
// so subsequent calls return instantly (just a mutex + stat).
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

	cmd := exec.Command(exePath, "--appimage-mount")
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return "", fmt.Errorf("pipe AppImage stdout: %w", err)
	}
	if err := cmd.Start(); err != nil {
		return "", fmt.Errorf("start AppImage mount: %w", err)
	}

	// --appimage-mount prints the mount path as its first (and only) stdout
	// line, then blocks until killed.
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

// teardown kills the mount subprocess, which also triggers the squashfs
// unmount via the AppImage runtime's cleanup handler.
func (m *appImageMount) teardown() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.teardownLocked()
}

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
