package main

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"os/exec"
	"runtime"
	"strings"
)

func isAppImagePath(path string) bool {
	return strings.HasSuffix(strings.ToLower(path), ".appimage") && runtime.GOOS == "linux" // avoids capitalization problems
}

type appImageMount struct {
	ProcessHandle     *exec.Cmd
	AppImageMountPath string
}

func newAppImageMount(appImagePath string) (*appImageMount, error) {
	if !isAppImagePath(appImagePath) {
		return nil, nil
	}
	cmd := exec.Command("flatpak-spawn", "--host", strings.TrimPrefix(appImagePath, "/run/host"), "--appimage-mount")
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, err
	}
	if err := cmd.Start(); err != nil {
		return nil, err
	}

	reader := bufio.NewReader(stdout)
	line, err := reader.ReadString('\n')
	if err != nil && !errors.Is(err, io.EOF) {
		bs, _ := io.ReadAll(stderr)
		return nil, fmt.Errorf("reading mount path: %w; stderr=%s", err, strings.TrimSpace(string(bs)))
	}
	mountPath := strings.TrimSpace(line)
	if mountPath == "" {
		bs, _ := io.ReadAll(stderr)
		// Ensure we don't leave a stray process running if mount failed
		_ = cmd.Process.Kill()
		return nil, fmt.Errorf("empty mount path; stderr=%s", strings.TrimSpace(string(bs)))
	}

	return &appImageMount{
		ProcessHandle:     cmd,
		AppImageMountPath: mountPath,
	}, nil
}

func (m *appImageMount) Close() error {
	if m.ProcessHandle != nil {
		return m.ProcessHandle.Process.Kill()
	}
	return nil
}
