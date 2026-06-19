package registry

import (
	"testing"
	"time"

	"railyard/internal/config"
	"railyard/internal/testutil"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func mustUnix(t *testing.T, value string) int64 {
	t.Helper()
	parsed, err := time.Parse(time.RFC3339, value)
	require.NoError(t, err)
	return parsed.Unix()
}

func newTestRegistry(t *testing.T) *Registry {
	t.Helper()
	return NewRegistry(testutil.TestLogSink{}, config.NewConfig(testutil.TestLogSink{}))
}

func integrityReport(id string, versions map[string]types.IntegrityVersionStatus) types.RegistryIntegrityReport {
	return types.RegistryIntegrityReport{
		SchemaVersion: 1,
		GeneratedAt:   "1970-01-01T00:00:00Z",
		Listings: map[string]types.IntegrityListing{
			id: {HasCompleteVersion: true, Versions: versions},
		},
	}
}

// TestLoadLastUpdatedPrefersManifestValue verifies the manifest-provided
// last_updated (published by the registry pipeline) wins over integrity data
// and requires no network access.
func TestLoadLastUpdatedPrefersManifestValue(t *testing.T) {
	reg := newTestRegistry(t)
	reg.mods = []types.ModManifest{{AssetManifest: types.AssetManifest{ID: "mod-a", LastUpdated: 1_700_000_000}}}
	reg.maps = []types.MapManifest{{AssetManifest: types.AssetManifest{ID: "map-a", LastUpdated: 1_700_000_001}}}
	// Integrity data that, if it leaked through, would produce a different value.
	reg.integrityMods = integrityReport("mod-a", map[string]types.IntegrityVersionStatus{
		"1.0.0": {IsComplete: true, CheckedAt: "2020-01-01T00:00:00Z"},
	})
	reg.integrityMaps = integrityReport("map-a", map[string]types.IntegrityVersionStatus{
		"1.0.0": {IsComplete: true, CheckedAt: "2020-01-01T00:00:00Z"},
	})

	modLastUpdated, mapLastUpdated := reg.loadLastUpdated(reg.mods, reg.maps)
	updateManifestLastUpdated(reg.mods, reg.maps, modLastUpdated, mapLastUpdated)

	require.Equal(t, int64(1_700_000_000), reg.mods[0].LastUpdated)
	require.Equal(t, int64(1_700_000_001), reg.maps[0].LastUpdated)
}

// TestLoadLastUpdatedFallsBackToIntegrityCheckedAt verifies that when the
// manifest carries no last_updated, the newest complete-version checked_at from
// the integrity report is used.
func TestLoadLastUpdatedFallsBackToIntegrityCheckedAt(t *testing.T) {
	reg := newTestRegistry(t)
	reg.maps = []types.MapManifest{{AssetManifest: types.AssetManifest{ID: "map-a"}}}
	reg.integrityMaps = integrityReport("map-a", map[string]types.IntegrityVersionStatus{
		"1.0.0": {IsComplete: true, CheckedAt: "2026-04-14T00:00:00Z"},
		"1.1.0": {IsComplete: true, CheckedAt: "2026-04-15T03:51:46Z"},
		"1.2.0": {IsComplete: false, CheckedAt: "2026-04-16T00:00:00Z"}, // incomplete: ignored
	})

	_, mapLastUpdated := reg.loadLastUpdated(reg.mods, reg.maps)
	require.Equal(t, mustUnix(t, "2026-04-15T03:51:46Z"), mapLastUpdated["map-a"])
}

func TestDetermineLatestTimestampWithStable(t *testing.T) {
	versions := []types.VersionInfo{
		{Version: "2.0.0", Date: "2026-01-02T00:00:00Z", Prerelease: true},
		{Version: "1.5.0", Date: "2026-01-01T00:00:00Z", Prerelease: false},
	}

	latest, err := determineLatestTimestamp(testutil.TestLogSink{}, versions, "github")
	require.NoError(t, err)
	require.Equal(t, mustUnix(t, "2026-01-01T00:00:00Z"), latest)
}

func TestDetermineLatestTimestampFallbackToPreRelease(t *testing.T) {
	versions := []types.VersionInfo{
		{Version: "1.0.0", Date: "2026-01-01T00:00:00Z", Prerelease: true},
		{Version: "1.0.1", Date: "2026-01-03T00:00:00Z", Prerelease: true},
	}

	latest, err := determineLatestTimestamp(testutil.TestLogSink{}, versions, "github")
	require.NoError(t, err)
	require.Equal(t, mustUnix(t, "2026-01-03T00:00:00Z"), latest)
}

func TestDetermineLatestTimestampRejectsWrongLayout(t *testing.T) {
	githubVersions := []types.VersionInfo{
		{Version: "1.0.0", Date: "2026-01-01"},
	}
	_, githubErr := determineLatestTimestamp(testutil.TestLogSink{}, githubVersions, "github")
	require.Error(t, githubErr)

	customVersions := []types.VersionInfo{
		{Version: "1.0.0", Date: "2026-01-01T00:00:00Z"},
	}
	_, customErr := determineLatestTimestamp(testutil.TestLogSink{}, customVersions, "custom")
	require.Error(t, customErr)
}

// TestLoadLastUpdatedDefaultsToEpochWhenNoData verifies that assets with neither
// a manifest last_updated nor integrity checked_at default to epoch (0) rather
// than failing or making a network request.
func TestLoadLastUpdatedDefaultsToEpochWhenNoData(t *testing.T) {
	reg := newTestRegistry(t)
	reg.mods = []types.ModManifest{{AssetManifest: types.AssetManifest{ID: "mod-bad"}}}
	reg.maps = []types.MapManifest{{AssetManifest: types.AssetManifest{ID: "map-bad"}}}

	modLastUpdated, mapLastUpdated := reg.loadLastUpdated(reg.mods, reg.maps)
	require.Equal(t, int64(0), modLastUpdated["mod-bad"])
	require.Equal(t, int64(0), mapLastUpdated["map-bad"])
}
