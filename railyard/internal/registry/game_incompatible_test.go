package registry

import (
	"testing"

	"railyard/internal/config"
	"railyard/internal/testutil"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func TestGameIncompatibleAssets(t *testing.T) {
	reg := NewRegistry(testutil.TestLogSink{}, config.NewConfig(testutil.TestLogSink{}))
	reg.integrityMods = types.RegistryIntegrityReport{
		SchemaVersion: 1,
		Listings: map[string]types.IntegrityListing{
			// Only version needs >=1.4.0 → incompatible with 1.3.0.
			"mod-incompatible": {
				HasCompleteVersion: true,
				Versions: map[string]types.IntegrityVersionStatus{
					"2.0.0": {IsComplete: true, GameVersion: ">=1.4.0"},
				},
			},
			// One incompatible + one compatible complete version → not flagged.
			"mod-mixed": {
				HasCompleteVersion: true,
				Versions: map[string]types.IntegrityVersionStatus{
					"2.0.0": {IsComplete: true, GameVersion: ">=1.4.0"},
					"1.5.0": {IsComplete: true, GameVersion: ">=1.0.0"},
				},
			},
			// No game_version recorded → treated as compatible (optimistic).
			"mod-no-constraint": {
				HasCompleteVersion: true,
				Versions: map[string]types.IntegrityVersionStatus{
					"1.0.0": {IsComplete: true},
				},
			},
			// The incompatible version is incomplete (ignored); the complete one is compatible.
			"mod-incomplete-ignored": {
				HasCompleteVersion: true,
				Versions: map[string]types.IntegrityVersionStatus{
					"2.0.0": {IsComplete: false, GameVersion: ">=1.4.0"},
					"1.0.0": {IsComplete: true, GameVersion: ">=1.0.0"},
				},
			},
			// No installable version → delisted, not a game-incompatibility.
			"mod-delisted": {
				HasCompleteVersion: false,
				Versions: map[string]types.IntegrityVersionStatus{
					"1.0.0": {IsComplete: false, GameVersion: ">=1.4.0"},
				},
			},
		},
	}

	resp := reg.GameIncompatibleAssets(types.AssetTypeMod, "1.3.0")
	require.Equal(t, types.ResponseSuccess, resp.Status)
	require.Equal(t, []string{"mod-incompatible"}, resp.AssetIDs)
}

func TestGameIncompatibleAssetsMapBuildingsConstraint(t *testing.T) {
	reg := NewRegistry(testutil.TestLogSink{}, config.NewConfig(testutil.TestLogSink{}))
	reg.integrityMaps = types.RegistryIntegrityReport{
		Listings: map[string]types.IntegrityListing{
			// Binary-only buildings index → requires game >1.3.0.
			"map-bin-only": {
				HasCompleteVersion: true,
				Versions: map[string]types.IntegrityVersionStatus{
					"1.0.0": {
						IsComplete:   true,
						GameVersion:  ">=1.0.0",
						MatchedFiles: map[string]string{"buildings_index_bin": "sha"},
					},
				},
			},
			// Both formats present → compatible with any game version.
			"map-both": {
				HasCompleteVersion: true,
				Versions: map[string]types.IntegrityVersionStatus{
					"1.0.0": {
						IsComplete:  true,
						GameVersion: ">=1.0.0",
						MatchedFiles: map[string]string{
							"buildings_index_bin":  "sha",
							"buildings_index_json": "sha",
						},
					},
				},
			},
		},
	}

	// Old game: the binary-only map fails its buildings-format constraint.
	require.Equal(t, []string{"map-bin-only"},
		reg.GameIncompatibleAssets(types.AssetTypeMap, "1.2.0").AssetIDs)
	// New game: both maps compatible.
	require.Empty(t, reg.GameIncompatibleAssets(types.AssetTypeMap, "1.4.0").AssetIDs)
}

func TestGameIncompatibleAssetsUnknownGameVersion(t *testing.T) {
	reg := NewRegistry(testutil.TestLogSink{}, config.NewConfig(testutil.TestLogSink{}))
	reg.integrityMods = types.RegistryIntegrityReport{
		Listings: map[string]types.IntegrityListing{
			"mod-incompatible": {
				HasCompleteVersion: true,
				Versions: map[string]types.IntegrityVersionStatus{
					"2.0.0": {IsComplete: true, GameVersion: ">=1.4.0"},
				},
			},
		},
	}

	// Undetected/unparseable game version must never flag anything.
	require.Empty(t, reg.GameIncompatibleAssets(types.AssetTypeMod, "").AssetIDs)
	require.Empty(t, reg.GameIncompatibleAssets(types.AssetTypeMod, "not-a-version").AssetIDs)
}
