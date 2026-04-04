package main

import (
	"testing"

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

func TestRunStartupAutoUpdateSubscriptionsTriggersForSuccessAndWarn(t *testing.T) {
	profile := types.DefaultProfile()
	profile.SystemPreferences.AutoUpdateSubscriptions = true

	callCount := 0
	updateFn := func(req types.UpdateSubscriptionsToLatestRequest) types.UpdateSubscriptionsResult {
		callCount++
		require.Equal(t, profile.ID, req.ProfileID)
		require.True(t, req.Apply)
		require.Empty(t, req.Targets)
		return types.UpdateSubscriptionsResult{
			GenericResponse: types.SuccessResponse("ok"),
		}
	}

	runStartupAutoUpdateSubscriptions(newTestApp().Logger, profile, types.ResponseSuccess, updateFn)
	runStartupAutoUpdateSubscriptions(newTestApp().Logger, profile, types.ResponseWarn, updateFn)
	require.Equal(t, 2, callCount)
}

func TestRunStartupAutoUpdateSubscriptionsSkipsWhenDisabledOrSyncFailed(t *testing.T) {
	profile := types.DefaultProfile()

	callCount := 0
	updateFn := func(types.UpdateSubscriptionsToLatestRequest) types.UpdateSubscriptionsResult {
		callCount++
		return types.UpdateSubscriptionsResult{GenericResponse: types.SuccessResponse("ok")}
	}

	runStartupAutoUpdateSubscriptions(newTestApp().Logger, profile, types.ResponseSuccess, updateFn)
	profile.SystemPreferences.AutoUpdateSubscriptions = true
	runStartupAutoUpdateSubscriptions(newTestApp().Logger, profile, types.ResponseError, updateFn)
	require.Equal(t, 0, callCount)
}
