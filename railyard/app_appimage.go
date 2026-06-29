package main

import (
	"errors"
	"io"
	"os/exec"
	"runtime"
	"strings"
)

func isAppImagePath(path string) bool {
	return strings.HasSuffix(path, ".AppImage") && runtime.GOOS == "linux"
}

type appImageMount struct {
	ProcessHandle     *exec.Cmd
	AppImageMountPath string
}

func newAppImageMount(appImagePath string) (*appImageMount, error) {
	if !isAppImagePath(appImagePath) {
		return nil, nil
	}
	cmd := exec.Command(appImagePath, "--appimage-mount")
	pipe, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	err = cmd.Start()
	if err != nil {
		return nil, err
	}
	pathBuffer := make([]byte, 128) // Assuming the mount path won't exceed 128 bytes, its only around like 24 bytes in practice
	n, err := pipe.Read(pathBuffer)
	if err != nil && !errors.Is(err, io.EOF) {
		return nil, err
	}
	return &appImageMount{
		ProcessHandle:     cmd,
		AppImageMountPath: string(pathBuffer[:n]),
	}, nil
}

func (m *appImageMount) Close() error {
	if m.ProcessHandle != nil {
		return m.ProcessHandle.Process.Kill()
	}
	return nil
}
