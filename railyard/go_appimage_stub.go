//go:build !linux

package main

import (
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

// Won't be called on non-linux platforms, but we need to implement it to satisfy the interface
func newAppImageMount(appImagePath string) (*appImageMount, error) {
	return nil, nil
}

// Won't be called on non-linux platforms, but we need to implement it to satisfy the interface
func (m *appImageMount) Close() error {
	return nil
}
