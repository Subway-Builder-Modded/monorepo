package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

// fakeMount returns a commandFor func that starts a helper process which
// prints mountPath to stdout then blocks until killed — mimicking AppImage's
// --appimage-mount behaviour without requiring a real AppImage binary.
func fakeMount(t *testing.T, mountPath string) func(string) *exec.Cmd {
	t.Helper()
	if runtime.GOOS == "windows" {
		return func(exePath string) *exec.Cmd {
			return exec.Command("cmd", "/c", fmt.Sprintf("echo %s& ping -n 999 127.0.0.1 >nul", mountPath))
		}
	}
	return func(exePath string) *exec.Cmd {
		return exec.Command("sh", "-c", fmt.Sprintf("printf '%%s\\n' '%s'; sleep 999", mountPath))
	}
}

// fakeMountFile creates a dummy file at dir/<name>.AppImage and returns its path.
func fakeMountFile(t *testing.T, dir, name string) string {
	t.Helper()
	path := filepath.Join(dir, name+".AppImage")
	require.NoError(t, os.WriteFile(path, []byte("fake"), 0755))
	return path
}

func TestIsAppImagePath(t *testing.T) {
	cases := []struct {
		path  string
		valid bool
	}{
		{"/home/user/game.AppImage", true},
		{"/home/user/game.appimage", true},
		{"/home/user/game.APPIMAGE", true},
		{"game.AppImage", true},
		{"/home/user/game.exe", false},
		{"/home/user/game", false},
		{"", false},
	}
	for _, tc := range cases {
		want := tc.valid && runtime.GOOS == "linux"
		require.Equal(t, want, isAppImagePath(tc.path), "path: %s", tc.path)
	}
}

func TestAppImageMountEnsureMountedReturnsMountPath(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("subprocess test not supported on Windows")
	}
	dir := t.TempDir()
	appImage := fakeMountFile(t, dir, "game")
	mountDir := filepath.Join(dir, "squashfs-root")

	m := &appImageMount{commandFor: fakeMount(t, mountDir)}
	got, err := m.ensureMounted(appImage)
	require.NoError(t, err)
	require.Equal(t, mountDir, got)
	t.Cleanup(m.teardown)
}

func TestAppImageMountCachesOnSameMtime(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("subprocess test not supported on Windows")
	}
	dir := t.TempDir()
	appImage := fakeMountFile(t, dir, "game")
	mountDir := filepath.Join(dir, "squashfs-root")

	calls := 0
	m := &appImageMount{
		commandFor: func(exePath string) *exec.Cmd {
			calls++
			return fakeMount(t, mountDir)(exePath)
		},
	}
	t.Cleanup(m.teardown)

	_, err := m.ensureMounted(appImage)
	require.NoError(t, err)
	firstPID := m.cmd.Process.Pid

	_, err = m.ensureMounted(appImage)
	require.NoError(t, err)

	require.Equal(t, 1, calls, "command should not be re-run when mtime is unchanged")
	require.Equal(t, firstPID, m.cmd.Process.Pid, "same process should be reused")
}

func TestAppImageMountRemountsAfterMtimeChange(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("subprocess test not supported on Windows")
	}
	dir := t.TempDir()
	appImage := fakeMountFile(t, dir, "game")
	mountDir := filepath.Join(dir, "squashfs-root")

	calls := 0
	m := &appImageMount{
		commandFor: func(exePath string) *exec.Cmd {
			calls++
			return fakeMount(t, mountDir)(exePath)
		},
	}
	t.Cleanup(m.teardown)

	_, err := m.ensureMounted(appImage)
	require.NoError(t, err)
	firstPID := m.cmd.Process.Pid

	// Simulate a game update by bumping the file mtime.
	future := time.Now().Add(2 * time.Second)
	require.NoError(t, os.Chtimes(appImage, future, future))

	_, err = m.ensureMounted(appImage)
	require.NoError(t, err)

	require.Equal(t, 2, calls, "command should be re-run after mtime change")
	require.NotEqual(t, firstPID, m.cmd.Process.Pid, "a new process should replace the old one")
}

func TestAppImageMountTeardownKillsProcess(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("subprocess test not supported on Windows")
	}
	dir := t.TempDir()
	appImage := fakeMountFile(t, dir, "game")
	mountDir := filepath.Join(dir, "squashfs-root")

	m := &appImageMount{commandFor: fakeMount(t, mountDir)}
	_, err := m.ensureMounted(appImage)
	require.NoError(t, err)

	proc := m.cmd.Process
	m.teardown()

	require.Nil(t, m.cmd)

	// Process should no longer be alive.
	err = proc.Signal(os.Interrupt)
	require.Error(t, err, "process should be dead after teardown")
}

func TestAppImageMountTeardownIsIdempotent(t *testing.T) {
	m := &appImageMount{}
	m.teardown()
	m.teardown() // should not panic or block
}
