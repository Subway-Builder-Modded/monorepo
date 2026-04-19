package main

import (
	"testing"

	"railyard/internal/config"
	"railyard/internal/logger"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func newTestApp() *App {
	return &App{Logger: logger.LoggerAtPath("")}
}

func TestIsStartupReady(t *testing.T) {
	app := newTestApp()
	require.False(t, app.IsStartupReady().Ready)

	app.setStartupReady(true)
	require.True(t, app.IsStartupReady().Ready)

	app.setStartupReady(false)
	require.False(t, app.IsStartupReady().Ready)
}

func TestOpenInFileExplorerRejectsInvalidPaths(t *testing.T) {
	app := newTestApp()

	empty := app.OpenInFileExplorer("   ")
	require.Equal(t, types.ResponseError, empty.Status)
	require.Equal(t, "invalid path", empty.Message)

	missing := app.OpenInFileExplorer("this-path-does-not-exist")
	require.Equal(t, types.ResponseError, missing.Status)
	require.Contains(t, missing.Message, "failed to resolve path")
}

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
		firstResult <- app.LaunchGame()
	}()

	<-ready

	second := app.LaunchGame()
	require.Equal(t, types.ResponseError, second.Status)
	require.Equal(t, "game is already starting", second.Message)

	close(block)

	first := <-firstResult
	require.Equal(t, types.ResponseError, first.Status)
	require.Equal(t, "game executable path is not configured or invalid", first.Message)
	require.False(t, app.gameStarting)
}
