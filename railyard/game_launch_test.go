package main

import (
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

	firstResult := make(chan types.GenericResponse, 1)
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
