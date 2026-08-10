package profiles

import (
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"railyard/internal/files"
	"railyard/internal/paths"
	"railyard/internal/testutil"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func TestQuarantineUserProfilesFileMovesSourceToBackup(t *testing.T) {
	testutil.NewHarness(t)
	writeRawUserProfilesFile(t, "{}")

	svc := userProfilesService(t)
	success, backupPath := svc.QuarantineUserProfiles()
	require.True(t, success)
	require.NotEmpty(t, backupPath)
	require.True(t, strings.Contains(filepath.Base(backupPath), "user_profiles.invalid."))

	_, err := os.Stat(backupPath)
	require.NoError(t, err)

	_, err = os.Stat(paths.UserProfilesPath())
	require.True(t, errors.Is(err, fs.ErrNotExist))
}

func TestClearRestoreDestinationRemovesDirectory(t *testing.T) {
	testutil.NewHarness(t)

	dirPath := filepath.Join(t.TempDir(), "restore-destination")
	require.NoError(t, os.MkdirAll(dirPath, 0o755))
	require.NoError(t, os.WriteFile(filepath.Join(dirPath, "data.txt"), []byte("x"), 0o644))

	require.NoError(t, clearRestoreDestination(dirPath))
	_, err := os.Stat(dirPath)
	require.True(t, errors.Is(err, fs.ErrNotExist))
}

func TestClearRestoreDestinationNoopWhenMissing(t *testing.T) {
	testutil.NewHarness(t)

	dirPath := filepath.Join(t.TempDir(), "missing-destination")
	require.NoError(t, clearRestoreDestination(dirPath))
}

// newArchiveTestService builds a profiles service with one subscribed, materialized map
// (code AAA) so archive round-trip tests can exercise the map artifact copy paths.
func newArchiveTestService(t *testing.T) (*UserProfiles, string) {
	t.Helper()

	state := types.InitialProfilesState()
	profile := newTestUserProfile("profile_0", "Archive Test")
	profile.Subscriptions.Maps["map-a"] = "1.0.0"
	state.Profiles[profile.ID] = profile

	svc, cfg, reg := loadedUserProfilesServiceWithDependencies(t, state)
	configureConfig(t, cfg)

	reg.AddInstalledMap("map-a", "1.0.0", false, types.ConfigData{Code: "AAA", Name: "Archive Map", Version: "1.0.0"})
	materializeInstalledAssets(t, cfg, nil, reg.GetInstalledMaps())

	return svc, profile.ID
}

func TestProfileArchiveRoundTripsFoundationTiles(t *testing.T) {
	svc, profileID := newArchiveTestService(t)
	foundationTilePath := paths.JoinLocalPath(paths.TilesPath(), "AAA"+files.MapFoundationTileFileExt)
	require.NoError(t, os.WriteFile(foundationTilePath, []byte("foundations-v1"), 0o644))

	createResult := svc.CreateProfileArchive(profileID)
	require.Equal(t, types.ResponseSuccess, createResult.Status, createResult.Message)

	// Simulate another profile's state occupying the shared tiles directory.
	require.NoError(t, os.WriteFile(foundationTilePath, []byte("stale"), 0o644))

	restoreResult := svc.RestoreProfileArchive(profileID)
	require.Equal(t, types.ResponseSuccess, restoreResult.Status, restoreResult.Message)

	restored, err := os.ReadFile(foundationTilePath)
	require.NoError(t, err)
	require.Equal(t, "foundations-v1", string(restored))
}

func TestProfileRestoreClearsStaleFoundationTilesForLegacyArchives(t *testing.T) {
	svc, profileID := newArchiveTestService(t)

	// Archive created while the map has no foundation tiles — the shape of any
	// archive written before foundations were included in the archive format.
	createResult := svc.CreateProfileArchive(profileID)
	require.Equal(t, types.ResponseSuccess, createResult.Status, createResult.Message)

	// A foundations file appears afterwards (e.g. left by another profile).
	foundationTilePath := paths.JoinLocalPath(paths.TilesPath(), "AAA"+files.MapFoundationTileFileExt)
	require.NoError(t, os.WriteFile(foundationTilePath, []byte("stale"), 0o644))

	restoreResult := svc.RestoreProfileArchive(profileID)
	require.Equal(t, types.ResponseSuccess, restoreResult.Status, restoreResult.Message)

	require.NoFileExists(t, foundationTilePath)
	require.FileExists(t, paths.JoinLocalPath(paths.TilesPath(), "AAA.pmtiles"))
}
