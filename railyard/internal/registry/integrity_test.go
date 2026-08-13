package registry

import (
	"testing"

	"railyard/internal/testutil/registrytest"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func TestGetInstallableVersions(t *testing.T) {
	reg := newTestRegistry(t)
	registrytest.SetManifestsForTest(t, reg, nil, []types.MapManifest{
		func() types.MapManifest {
			manifest := registrytest.MockMapManifestWithIDAndCode("map-a", "AAA")
			manifest.Update = types.UpdateConfig{
				Type: "custom",
				URL:  "https://example.com/update.json",
			}
			return manifest
		}(),
	})
	reg.integrityMaps = types.RegistryIntegrityReport{
		SchemaVersion: 1,
		GeneratedAt:   "1970-01-01T00:00:00Z",
		Listings: map[string]types.IntegrityListing{
			"map-a": {
				HasCompleteVersion: true,
				CompleteVersions:   []string{"1.0.0", "1.1.0"},
				Versions: map[string]types.IntegrityVersionStatus{
					"1.0.0": {IsComplete: true},
					"1.1.0": {IsComplete: true},
					"2.0.0": {IsComplete: false},
				},
			},
		},
	}

	reg.versions.set("custom|https://example.com/update.json", []types.VersionInfo{
		{Version: "2.0.0"},
		{Version: "1.1.0"},
		{Version: "1.0.0"},
	})

	filtered, err := reg.GetInstallableVersions(types.AssetTypeMap, "map-a")
	require.NoError(t, err)
	require.Len(t, filtered, 2)
	require.Equal(t, "1.1.0", filtered[0].Version)
	require.Equal(t, "1.0.0", filtered[1].Version)
}

func TestGetDisplayableVersionsIncludesUnavailableEntries(t *testing.T) {
	reg := newTestRegistry(t)
	registrytest.SetManifestsForTest(t, reg, nil, []types.MapManifest{
		func() types.MapManifest {
			manifest := registrytest.MockMapManifestWithIDAndCode("map-a", "AAA")
			manifest.Update = types.UpdateConfig{
				Type: "custom",
				URL:  "https://example.com/update.json",
			}
			return manifest
		}(),
	})
	reg.integrityMaps = types.RegistryIntegrityReport{
		SchemaVersion: 1,
		GeneratedAt:   "1970-01-01T00:00:00Z",
		Listings: map[string]types.IntegrityListing{
			"map-a": {
				HasCompleteVersion: true,
				CompleteVersions:   []string{"1.2.0"},
				Versions: map[string]types.IntegrityVersionStatus{
					"1.2.0": {IsComplete: true},
					// Retired: still enumerated by the author's update.json.
					"1.1.0": {IsComplete: false, Availability: "retired"},
					// Removed: no longer enumerated upstream at all.
					"1.0.0": {
						IsComplete:   false,
						Availability: "removed",
						GameVersion:  ">=1.0.0",
						ReleasedAt:   "2026-05-01T00:00:00.000Z",
					},
					// Plain incomplete (broken) version: never displayed.
					"2.0.0-broken": {IsComplete: false},
				},
			},
		},
	}
	reg.versions.set("custom|https://example.com/update.json", []types.VersionInfo{
		{Version: "1.2.0", Changelog: "Latest", DownloadURL: "https://example.com/1.2.0.zip"},
		{Version: "1.1.0", Changelog: "Retired changelog", Date: "2026-06-01", DownloadURL: ""},
	})

	displayable, err := reg.GetDisplayableVersions(types.AssetTypeMap, "map-a")
	require.NoError(t, err)
	require.Len(t, displayable, 3)

	// Semver-descending: 1.2.0 (live), 1.1.0 (retired), 1.0.0 (removed).
	require.Equal(t, "1.2.0", displayable[0].Version)
	require.Empty(t, displayable[0].Availability)

	retired := displayable[1]
	require.Equal(t, "1.1.0", retired.Version)
	require.Equal(t, "retired", retired.Availability)
	require.Equal(t, "Retired changelog", retired.Changelog)
	require.Equal(t, "2026-06-01", retired.Date)
	require.Empty(t, retired.DownloadURL)
	require.Empty(t, retired.MapBuildingsConstraint)

	removed := displayable[2]
	require.Equal(t, "1.0.0", removed.Version)
	require.Equal(t, "removed", removed.Availability)
	require.Equal(t, "2026-05-01T00:00:00.000Z", removed.Date)
	require.Equal(t, ">=1.0.0", removed.GameVersion)
	require.Empty(t, removed.DownloadURL)

	// Install flows keep the complete-only view.
	installable, err := reg.GetInstallableVersions(types.AssetTypeMap, "map-a")
	require.NoError(t, err)
	require.Len(t, installable, 1)
	require.Equal(t, "1.2.0", installable[0].Version)
}

func TestGetDisplayableVersionsClearsDeadArtifactURLs(t *testing.T) {
	reg := newTestRegistry(t)
	registrytest.SetManifestsForTest(t, reg, nil, []types.MapManifest{
		func() types.MapManifest {
			manifest := registrytest.MockMapManifestWithIDAndCode("map-a", "AAA")
			manifest.Update = types.UpdateConfig{
				Type: "custom",
				URL:  "https://example.com/update.json",
			}
			return manifest
		}(),
	})
	reg.integrityMaps = types.RegistryIntegrityReport{
		SchemaVersion: 1,
		GeneratedAt:   "1970-01-01T00:00:00Z",
		Listings: map[string]types.IntegrityListing{
			"map-a": {
				HasCompleteVersion: true,
				CompleteVersions:   []string{"1.1.0"},
				Versions: map[string]types.IntegrityVersionStatus{
					"1.1.0": {IsComplete: true},
					"1.0.0": {IsComplete: false, Availability: "retired"},
				},
			},
		},
	}
	// Upstream still lists a (dead) download URL for the retired version.
	reg.versions.set("custom|https://example.com/update.json", []types.VersionInfo{
		{Version: "1.1.0", DownloadURL: "https://example.com/1.1.0.zip"},
		{Version: "1.0.0", DownloadURL: "https://example.com/dead.zip", SHA256: "abc", Manifest: "https://example.com/m.json"},
	})

	displayable, err := reg.GetDisplayableVersions(types.AssetTypeMap, "map-a")
	require.NoError(t, err)
	require.Len(t, displayable, 2)
	require.Empty(t, displayable[1].DownloadURL)
	require.Empty(t, displayable[1].SHA256)
	require.Empty(t, displayable[1].Manifest)
}

func TestGetInstallableVersionsRejectsMissingOrIncompleteListings(t *testing.T) {
	reg := newTestRegistry(t)
	registrytest.SetManifestsForTest(t, reg, nil, []types.MapManifest{
		func() types.MapManifest {
			manifest := registrytest.MockMapManifestWithIDAndCode("missing-map", "BBB")
			manifest.Update = types.UpdateConfig{
				Type: "custom",
				URL:  "https://example.com/missing-update.json",
			}
			return manifest
		}(),
		func() types.MapManifest {
			manifest := registrytest.MockMapManifestWithIDAndCode("map-a", "AAA")
			manifest.Update = types.UpdateConfig{
				Type: "custom",
				URL:  "https://example.com/update.json",
			}
			return manifest
		}(),
	})
	reg.versions.set("custom|https://example.com/missing-update.json", []types.VersionInfo{
		{Version: "1.0.0"},
	})
	reg.versions.set("custom|https://example.com/update.json", []types.VersionInfo{
		{Version: "1.0.0"},
	})
	reg.integrityMaps = types.RegistryIntegrityReport{
		SchemaVersion: 1,
		GeneratedAt:   "1970-01-01T00:00:00Z",
		Listings: map[string]types.IntegrityListing{
			"map-a": {HasCompleteVersion: false},
		},
	}

	_, err := reg.GetInstallableVersions(types.AssetTypeMap, "missing-map")
	require.ErrorContains(t, err, "missing from integrity cache")

	_, err = reg.GetInstallableVersions(types.AssetTypeMap, "map-a")
	require.ErrorContains(t, err, "has no complete versions")
}

func TestAssetMissingInstallableVersion(t *testing.T) {
	reg := newTestRegistry(t)

	// No integrity report loaded: never reported as definitively missing (would be unsafe to purge).
	require.False(t, reg.AssetMissingInstallableVersion(types.AssetTypeMap, "map-a"))

	reg.integrityMaps = types.RegistryIntegrityReport{
		SchemaVersion: 1,
		GeneratedAt:   "1970-01-01T00:00:00Z",
		Listings: map[string]types.IntegrityListing{
			"map-complete":   {HasCompleteVersion: true},
			"map-incomplete": {HasCompleteVersion: false},
		},
	}

	require.False(t, reg.AssetMissingInstallableVersion(types.AssetTypeMap, "map-complete"))  // has a complete version
	require.True(t, reg.AssetMissingInstallableVersion(types.AssetTypeMap, "map-incomplete")) // listed but no complete version
	require.True(t, reg.AssetMissingInstallableVersion(types.AssetTypeMap, "map-delisted"))   // absent from a loaded report
}

func TestGameIncompatibleAssetsFlagsConstrainedTestListing(t *testing.T) {
	reg := newTestRegistry(t)
	// Mirrors the registry's compatibility-test-mod: is_test, complete, with a
	// game_version ceiling below the detected game.
	reg.integrityMods = types.RegistryIntegrityReport{
		SchemaVersion: 1,
		GeneratedAt:   "1970-01-01T00:00:00Z",
		Listings: map[string]types.IntegrityListing{
			"compatibility-test-mod": {
				HasCompleteVersion: true,
				Versions: map[string]types.IntegrityVersionStatus{
					"v1.0.0": {IsComplete: true, GameVersion: "<=1.3.0"},
				},
			},
			"unconstrained-mod": {
				HasCompleteVersion: true,
				Versions: map[string]types.IntegrityVersionStatus{
					"v1.0.0": {IsComplete: true},
				},
			},
		},
	}

	resp := reg.GameIncompatibleAssets(types.AssetTypeMod, "1.4.0")
	require.Equal(t, types.ResponseSuccess, resp.Status)
	require.Equal(t, []string{"compatibility-test-mod"}, resp.AssetIDs)

	// At or below the ceiling nothing is flagged.
	within := reg.GameIncompatibleAssets(types.AssetTypeMod, "1.3.0")
	require.Empty(t, within.AssetIDs)

	// Undetected game version is not a verdict.
	undetected := reg.GameIncompatibleAssets(types.AssetTypeMod, "")
	require.Empty(t, undetected.AssetIDs)
}
