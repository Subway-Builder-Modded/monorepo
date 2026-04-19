package registry

import (
	"testing"

	"railyard/internal/config"
	"railyard/internal/testutil"
	"railyard/internal/testutil/registrytest"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func TestGetInstallableVersions(t *testing.T) {
	reg := NewRegistry(testutil.TestLogSink{}, config.NewConfig(testutil.TestLogSink{}))
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

	reg.setCachedVersions("custom|https://example.com/update.json", []types.VersionInfo{
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

func TestGetInstallableVersionsRejectsMissingOrIncompleteListings(t *testing.T) {
	reg := NewRegistry(testutil.TestLogSink{}, config.NewConfig(testutil.TestLogSink{}))
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
	reg.setCachedVersions("custom|https://example.com/missing-update.json", []types.VersionInfo{
		{Version: "1.0.0"},
	})
	reg.setCachedVersions("custom|https://example.com/update.json", []types.VersionInfo{
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
