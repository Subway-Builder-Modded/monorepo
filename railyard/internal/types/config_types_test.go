package types

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"railyard/internal/constants"

	"github.com/stretchr/testify/require"
)

func TestAreConfigPathsConfigured(t *testing.T) {
	cfg := AppConfig{
		ExecutablePath:     "dir/executable.exe",
		MetroMakerDataPath: "dir/",
	}
	require.True(t, cfg.AreConfigPathsConfigured())

	cfg.MetroMakerDataPath = "   "
	require.False(t, cfg.AreConfigPathsConfigured())
}

func TestValidateConfigPaths(t *testing.T) {
	// Paths not configured
	cfg := AppConfig{}
	valid, result := cfg.ValidateConfigPaths()
	require.False(t, valid)
	require.False(t, result.IsConfigured)

	// Paths are configured but do not exist on disk
	cfg = AppConfig{
		MetroMakerDataPath: "blah/blah/",
		ExecutablePath:     "blah.exe",
	}
	valid, result = cfg.ValidateConfigPaths()
	require.False(t, valid)
	require.True(t, result.IsConfigured)
	require.False(t, result.MetroMakerDataPathValid)
	require.False(t, result.ExecutablePathValid)

	modDir := t.TempDir()
	exeFile := filepath.Join(modDir, "abcdef.exe")
	require.NoError(t, os.WriteFile(exeFile, []byte(""), 0o755))

	// Paths are configured and exist on disk
	cfg = AppConfig{
		MetroMakerDataPath: modDir,
		ExecutablePath:     exeFile,
	}
	valid, result = cfg.ValidateConfigPaths()
	require.True(t, valid)
	require.True(t, result.IsConfigured)
	require.True(t, result.MetroMakerDataPathValid)
	require.True(t, result.ExecutablePathValid)
}

func TestAppConfigFolderPathGetters(t *testing.T) {
	metroMakerDir := t.TempDir()
	exeName := "subway-builder"
	if runtime.GOOS == "windows" {
		exeName = "subway-builder.exe"
	}
	exePath := filepath.Join(metroMakerDir, exeName)
	require.NoError(t, os.WriteFile(exePath, []byte(""), 0o755))

	cfg := AppConfig{
		MetroMakerDataPath: metroMakerDir,
		ExecutablePath:     exePath,
	}

	require.Equal(t, filepath.Join(metroMakerDir, "mods"), cfg.GetModsFolderPath())
	require.Equal(t, filepath.Join(metroMakerDir, "public", "data", "city-maps"), cfg.GetThumbnailFolderPath())
	require.Equal(t, filepath.Join(metroMakerDir, "cities", "data"), cfg.GetMapsFolderPath())
}

// writeSteamGameInstall creates a fake Steam game install with the asar at the per-OS location.
func writeSteamGameInstall(t *testing.T) string {
	t.Helper()
	gameDir := filepath.Join(t.TempDir(), "Subway Builder")
	asarPath := constants.SteamGameAsarPath(gameDir)
	require.NoError(t, os.MkdirAll(filepath.Dir(asarPath), 0o755))
	require.NoError(t, os.WriteFile(asarPath, []byte("asar"), 0o644))
	return gameDir
}

func TestValidateConfigPathsSteamMode(t *testing.T) {
	dataDir := t.TempDir()
	gameDir := writeSteamGameInstall(t)

	// Steam mode validates the Steam game path; the executable path is irrelevant.
	cfg := AppConfig{MetroMakerDataPath: dataDir, UseSteamLaunch: true, SteamGamePath: gameDir}
	valid, result := cfg.ValidateConfigPaths()
	require.True(t, valid)
	require.True(t, result.IsConfigured)
	require.True(t, result.SteamGamePathValid)
	require.True(t, result.GameSourceValid)
	require.False(t, result.ExecutablePathValid)

	// Steam mode without a resolved game path is not configured.
	cfg.SteamGamePath = ""
	valid, result = cfg.ValidateConfigPaths()
	require.False(t, valid)
	require.False(t, result.IsConfigured)
	require.False(t, result.GameSourceValid)

	// A stale game path with no asar behind it is invalid.
	cfg.SteamGamePath = t.TempDir()
	valid, result = cfg.ValidateConfigPaths()
	require.False(t, valid)
	require.True(t, result.IsConfigured)
	require.False(t, result.SteamGamePathValid)
	require.False(t, result.GameSourceValid)
}

func TestValidateConfigPathsSteamInstallDoesNotBlessVanillaMode(t *testing.T) {
	// With Steam launch off, only the executable path counts, even when a valid Steam
	// install is known.
	cfg := AppConfig{
		MetroMakerDataPath: t.TempDir(),
		UseSteamLaunch:     false,
		SteamGamePath:      writeSteamGameInstall(t),
	}
	valid, result := cfg.ValidateConfigPaths()
	require.False(t, valid)
	require.False(t, result.IsConfigured)
	require.True(t, result.SteamGamePathValid)
	require.False(t, result.GameSourceValid)
}

func TestValidateConfigPathsLegacyConfigWithoutSteamFields(t *testing.T) {
	// Configs from clients that predate the Steam fields must not be rejected as incomplete.
	exeFile := filepath.Join(t.TempDir(), "game.exe")
	require.NoError(t, os.WriteFile(exeFile, []byte(""), 0o755))
	cfg := AppConfig{MetroMakerDataPath: t.TempDir(), ExecutablePath: exeFile}
	valid, result := cfg.ValidateConfigPaths()
	require.True(t, valid)
	require.True(t, result.IsConfigured)
	require.True(t, result.ExecutablePathValid)
	require.True(t, result.GameSourceValid)
}

func TestValidateConfigPathsAllowsAppBundleOnDarwin(t *testing.T) {
	if runtime.GOOS != "darwin" {
		t.Skip("darwin-only behavior")
	}

	metroMakerDir := t.TempDir()
	appBundlePath := filepath.Join(t.TempDir(), "Subway Builder.app")
	require.NoError(t, os.MkdirAll(appBundlePath, 0o755))

	cfg := AppConfig{
		MetroMakerDataPath: metroMakerDir,
		ExecutablePath:     appBundlePath,
	}
	valid, result := cfg.ValidateConfigPaths()
	require.True(t, valid)
	require.True(t, result.MetroMakerDataPathValid)
	require.True(t, result.ExecutablePathValid)
}
