package config

import (
	"testing"

	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func TestCriticalPathEditsRejectedWhileGameRunning(t *testing.T) {
	h := setup(t, testConfig())
	h.cfg.IsGameRunning = func() bool { return true }

	_, err := h.cfg.UpdateExecutable("other.exe")
	require.ErrorContains(t, err, "while the game is running")

	_, err = h.cfg.UpdateMetroMakerDataFolder(t.TempDir())
	require.ErrorContains(t, err, "while the game is running")

	require.Equal(t, types.ResponseError, h.cfg.UpdateUseSteamLaunch(true).Status)
	require.Equal(t, types.ResponseError, h.cfg.UpdateDefaultSteamLibraryPath("some/path").Status)
	require.Equal(t, types.ResponseError, h.cfg.ClearDefaultSteamLibraryPath().Status)
	require.Equal(t, types.ResponseError, h.cfg.ClearConfig().Status)
	require.Equal(t, types.ResponseError, h.cfg.OpenExecutableDialog(types.SetConfigPathOptions{}).Status)
	require.Equal(t, types.ResponseError, h.cfg.OpenMetroMakerDataFolderDialog(types.SetConfigPathOptions{}).Status)

	// The runtime config is untouched by the rejected edits.
	require.Equal(t, testConfig().ExecutablePath, h.runtime().Config.ExecutablePath)
	require.Equal(t, testConfig().MetroMakerDataPath, h.runtime().Config.MetroMakerDataPath)
}

func TestCriticalPathEditsAllowedWhenGameNotRunning(t *testing.T) {
	h := setup(t, testConfig())
	h.cfg.IsGameRunning = func() bool { return false }

	result, err := h.cfg.UpdateExecutable("other.exe")
	require.NoError(t, err)
	require.Equal(t, "other.exe", result.Config.ExecutablePath)
}

func TestNonCriticalEditsAllowedWhileGameRunning(t *testing.T) {
	h := setup(t, testConfig())
	h.cfg.IsGameRunning = func() bool { return true }

	require.Equal(t, types.ResponseSuccess, h.cfg.UpdateCheckForUpdatesOnLaunch(true).Status)
	require.Equal(t, types.ResponseSuccess, h.cfg.UpdateGithubToken("token").Status)
}
