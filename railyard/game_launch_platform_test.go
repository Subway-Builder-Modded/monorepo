package main

import (
	"os"
	"os/exec"
	"runtime"
	"testing"
	"time"

	"railyard/internal/constants"
	"railyard/internal/testutil"

	"github.com/stretchr/testify/require"
)

func hasEnv(cmd *exec.Cmd, entry string) bool {
	for _, e := range cmd.Env {
		if e == entry {
			return true
		}
	}
	return false
}

func TestBuildLaunchCommandSteamPaths(t *testing.T) {
	cases := []struct {
		goos string
		args []string
	}{
		{"darwin", []string{"open", constants.STEAM_URL}},
		{"linux", []string{"xdg-open", constants.STEAM_URL}},
		{"windows", []string{"cmd", "/C", "start", constants.STEAM_URL}},
	}
	for _, tc := range cases {
		t.Run(tc.goos, func(t *testing.T) {
			cmd := buildLaunchCommand(tc.goos, launchSpec{useSteam: true, exePath: "ignored"})
			require.Equal(t, tc.args, cmd.Args)
		})
	}
}

func TestBuildLaunchCommandDarwinAppBundle(t *testing.T) {
	spec := launchSpec{
		exePath:     "/Games/Subway Builder.app",
		extraArgs:   []string{"--flag"},
		useDevTools: true,
	}
	cmd := buildLaunchCommand("darwin", spec)

	// The bundle resolves to the inner binary, launched via shell.
	require.Equal(t, []string{
		"/bin/sh", "-c", `ELECTRON_ENABLE_LOGGING=1 exec "$0" "$@"`,
		"/Games/Subway Builder.app/Contents/MacOS/Subway Builder", "--flag",
	}, cmd.Args)
	require.True(t, hasEnv(cmd, "DEBUG_PROD=TRUE"))

	// A path already inside the bundle is used as-is.
	spec.exePath = "/Games/Subway Builder.app/Contents/MacOS/Subway Builder"
	spec.useDevTools = false
	cmd = buildLaunchCommand("darwin", spec)
	require.Equal(t, spec.exePath, cmd.Args[3])
	require.False(t, hasEnv(cmd, "DEBUG_PROD=TRUE"))
}

func TestBuildLaunchCommandDarwinNonBundleFallsBackToDirect(t *testing.T) {
	cmd := buildLaunchCommand("darwin", launchSpec{exePath: "/opt/game/subway-builder"})
	require.Equal(t, []string{"/opt/game/subway-builder"}, cmd.Args)
	require.Equal(t, "/opt/game", cmd.Dir)
}

func TestBuildLaunchCommandLinuxFlatpakVariants(t *testing.T) {
	// With the Chrome sandbox configured, env rides through --env flags.
	cmd := buildLaunchCommand("linux", launchSpec{
		exePath:               "/games/metro-maker4",
		extraArgs:             []string{"--flag"},
		useDevTools:           true,
		chromeSandboxPath:     "/opt/sandbox",
		flatpakSpawnAvailable: true,
	})
	require.Equal(t, []string{
		"flatpak-spawn",
		"--env=CHROME_DEVEL_SANDBOX=/opt/sandbox",
		"--env=DEBUG_PROD=TRUE",
		"--host", "/games/metro-maker4", "--flag",
	}, cmd.Args)

	// Without the sandbox path the game runs with --no-sandbox.
	cmd = buildLaunchCommand("linux", launchSpec{
		exePath:               "/games/metro-maker4",
		flatpakSpawnAvailable: true,
	})
	require.Equal(t, []string{"flatpak-spawn", "--host", "/games/metro-maker4", "--no-sandbox"}, cmd.Args)

	// Without flatpak-spawn the executable launches directly.
	cmd = buildLaunchCommand("linux", launchSpec{
		exePath:     "/games/metro-maker4",
		useDevTools: true,
	})
	require.Equal(t, []string{"/games/metro-maker4"}, cmd.Args)
	require.Equal(t, "/games", cmd.Dir)
	require.True(t, hasEnv(cmd, "DEBUG_PROD=TRUE"))
}

func TestBuildLaunchCommandWindowsDirect(t *testing.T) {
	cmd := buildLaunchCommand("windows", launchSpec{
		exePath:     `C:/Games/game.exe`,
		extraArgs:   []string{"--flag"},
		useDevTools: true,
	})
	require.Equal(t, []string{"C:/Games/game.exe", "--flag"}, cmd.Args)
	require.True(t, hasEnv(cmd, "DEBUG_PROD=TRUE"))
}

func TestSteamPIDFromLineParsers(t *testing.T) {
	pid, ok := linuxSteamPIDFromLine("1234 metro-maker4")
	require.True(t, ok)
	require.Equal(t, "1234", pid)

	_, ok = linuxSteamPIDFromLine("1234 some-other-process")
	require.False(t, ok)
	_, ok = linuxSteamPIDFromLine("metro-maker4")
	require.False(t, ok)

	pid, ok = darwinSteamPIDFromLine(" 4321 ")
	require.True(t, ok)
	require.Equal(t, "4321", pid)
	_, ok = darwinSteamPIDFromLine("")
	require.False(t, ok)
}

func TestSteamProcessFromPgrep(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("uses unix shell fixtures")
	}
	log := testutil.TestLogSink{}

	proc, err := steamProcessFromPgrep(exec.Command("echo", "999999 metro-maker4"), linuxSteamPIDFromLine, log)
	require.NoError(t, err)
	require.NotNil(t, proc)
	require.Equal(t, 999999, proc.Pid)

	// No matching line means keep polling.
	proc, err = steamProcessFromPgrep(exec.Command("echo", "1 unrelated"), linuxSteamPIDFromLine, log)
	require.NoError(t, err)
	require.Nil(t, proc)

	// pgrep's exit code 1 (no matches) also means keep polling.
	proc, err = steamProcessFromPgrep(exec.Command("sh", "-c", "exit 1"), linuxSteamPIDFromLine, log)
	require.NoError(t, err)
	require.Nil(t, proc)

	// Other failures abort discovery.
	_, err = steamProcessFromPgrep(exec.Command("sh", "-c", "exit 2"), linuxSteamPIDFromLine, log)
	require.Error(t, err)
}

func TestPollSteamGameProcess(t *testing.T) {
	log := testutil.TestLogSink{}

	// Found immediately.
	self := os.Process{Pid: os.Getpid()}
	cmd := pollSteamGameProcess(func() (*os.Process, error) {
		return &self, nil
	}, time.Now().Add(time.Minute), log)
	require.NotNil(t, cmd)
	require.Equal(t, os.Getpid(), cmd.Process.Pid)

	// Expired deadline yields nil without invoking lookup.
	cmd = pollSteamGameProcess(func() (*os.Process, error) {
		t.Fatal("lookup must not run after the deadline")
		return nil, nil
	}, time.Now().Add(-time.Second), log)
	require.Nil(t, cmd)

	// Unsupported OS (nil lookup) yields nil.
	require.Nil(t, pollSteamGameProcess(nil, time.Now().Add(time.Minute), log))
}
