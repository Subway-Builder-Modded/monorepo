package main

import (
	"os/exec"
	"runtime"
	"strings"
	"testing"

	"railyard/internal/config"
	"railyard/internal/gate"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func TestLaunchGameRejectsConcurrentStartWhileStarting(t *testing.T) {
	app := newTestApp()
	app.Config = config.NewConfig(app.Logger)
	app.emitEventFunc = func(string, ...interface{}) {}

	ready := make(chan struct{}, 1)
	block := make(chan struct{})
	app.launchGameTestReady = ready
	app.launchGameTestBlock = block

	firstResult := make(chan types.GameLaunchResponse, 1)
	go func() {
		firstResult <- app.LaunchGame(false)
	}()

	<-ready

	second := app.LaunchGame(false)
	require.Equal(t, types.ResponseError, second.Status)
	require.Equal(t, "game is already starting", second.Message)

	close(block)

	first := <-firstResult
	require.Equal(t, types.ResponseError, first.Status)
	require.Equal(t, "game executable path is not configured or invalid", first.Message)
	require.False(t, app.gameStarting)
}

func TestLaunchGameRejectedWhileContentOpsHoldGate(t *testing.T) {
	app := newTestApp()
	app.Config = config.NewConfig(app.Logger)
	app.emitEventFunc = func(string, ...interface{}) {}
	app.contentGate = &gate.GameContentGate{}
	require.NoError(t, app.contentGate.BeginContentOp())

	result := app.LaunchGame(false)
	require.Equal(t, types.ResponseError, result.Status)
	require.Contains(t, result.Message, "content is being installed")
	require.False(t, app.gameStarting)

	app.contentGate.EndContentOp()
	// With the gate free, the launch proceeds past exclusivity and fails on config instead,
	// releasing its session so a later launch remains possible.
	result = app.LaunchGame(false)
	require.Equal(t, types.ResponseError, result.Status)
	require.Equal(t, "game executable path is not configured or invalid", result.Message)
	require.False(t, app.contentGate.GameSessionActive())
}

func TestIsGameRunning(t *testing.T) {
	app := newTestApp()
	require.False(t, app.IsGameRunning().Running)

	app.gameCmd = &exec.Cmd{} // started, not yet waited on
	require.True(t, app.IsGameRunning().Running)

	finished := exec.Command("true")
	require.NoError(t, finished.Run())
	app.gameCmd = finished // ProcessState set after Wait
	require.False(t, app.IsGameRunning().Running)
}

func TestStopGameStateGuards(t *testing.T) {
	app := newTestApp()
	app.Config = config.NewConfig(app.Logger)

	app.gameStarting = true
	res := app.StopGame()
	require.Equal(t, types.ResponseError, res.Status)
	require.Equal(t, "game is still starting", res.Message)

	app.gameStarting = false
	res = app.StopGame()
	require.Equal(t, types.ResponseError, res.Status)
	require.Equal(t, "game is not running", res.Message)
}

func TestStopGameKillsRunningProcess(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("uses a sleep fixture process")
	}
	app := newTestApp()
	app.Config = config.NewConfig(app.Logger)

	cmd := exec.Command("sleep", "60")
	require.NoError(t, cmd.Start())
	app.gameCmd = cmd

	res := app.StopGame()
	require.Equal(t, types.ResponseSuccess, res.Status)
	require.Nil(t, app.gameCmd)
	require.False(t, app.gameStarting)
	_ = cmd.Wait() // reap the killed fixture
}

func TestStreamGameOutputEmitsPerLine(t *testing.T) {
	app := newTestApp()
	var lines []string
	app.emitEventFunc = func(name string, data ...interface{}) {
		require.Equal(t, "game:log", name)
		payload := data[0].(map[string]string)
		require.Equal(t, "stderr", payload["stream"])
		lines = append(lines, payload["line"])
	}

	app.streamGameOutput(strings.NewReader("first\nsecond\n"), "stderr")
	require.Equal(t, []string{"first", "second"}, lines)
}
