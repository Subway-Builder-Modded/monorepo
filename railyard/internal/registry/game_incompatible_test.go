package registry

import (
	"testing"

	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

// integrityListing builds a listing, deriving HasCompleteVersion from the versions' completeness.
func integrityListing(versions map[string]types.IntegrityVersionStatus) types.IntegrityListing {
	listing := types.IntegrityListing{Versions: versions}
	for _, status := range versions {
		if status.IsComplete {
			listing.HasCompleteVersion = true
			break
		}
	}
	return listing
}

func TestGameIncompatibleAssets(t *testing.T) {
	modListings := map[string]types.IntegrityListing{
		// Only version needs >=1.4.0 → incompatible with 1.3.0.
		"mod-incompatible": integrityListing(map[string]types.IntegrityVersionStatus{
			"2.0.0": {IsComplete: true, GameVersion: ">=1.4.0"},
		}),
		// One incompatible + one compatible complete version → not flagged.
		"mod-mixed": integrityListing(map[string]types.IntegrityVersionStatus{
			"2.0.0": {IsComplete: true, GameVersion: ">=1.4.0"},
			"1.5.0": {IsComplete: true, GameVersion: ">=1.0.0"},
		}),
		// No game_version recorded → treated as compatible (optimistic).
		"mod-no-constraint": integrityListing(map[string]types.IntegrityVersionStatus{
			"1.0.0": {IsComplete: true},
		}),
		// The incompatible version is incomplete (ignored); the complete one is compatible.
		"mod-incomplete-ignored": integrityListing(map[string]types.IntegrityVersionStatus{
			"2.0.0": {IsComplete: false, GameVersion: ">=1.4.0"},
			"1.0.0": {IsComplete: true, GameVersion: ">=1.0.0"},
		}),
		// No installable version → delisted, not a game-incompatibility.
		"mod-delisted": integrityListing(map[string]types.IntegrityVersionStatus{
			"1.0.0": {IsComplete: false, GameVersion: ">=1.4.0"},
		}),
	}
	mapListings := map[string]types.IntegrityListing{
		// Binary-only buildings index → requires game >1.3.0.
		"map-bin-only": integrityListing(map[string]types.IntegrityVersionStatus{
			"1.0.0": {
				IsComplete:   true,
				GameVersion:  ">=1.0.0",
				MatchedFiles: map[string]string{"buildings_index_bin": "sha"},
			},
		}),
		// Both formats present → compatible with any game version.
		"map-both": integrityListing(map[string]types.IntegrityVersionStatus{
			"1.0.0": {
				IsComplete:  true,
				GameVersion: ">=1.0.0",
				MatchedFiles: map[string]string{
					"buildings_index_bin":  "sha",
					"buildings_index_json": "sha",
				},
			},
		}),
	}

	cases := []struct {
		name        string
		assetType   types.AssetType
		listings    map[string]types.IntegrityListing
		gameVersion string
		want        []string
	}{
		{"mod with no compatible version is flagged", types.AssetTypeMod, modListings, "1.3.0", []string{"mod-incompatible"}},
		{"map fails its buildings-format constraint on an old game", types.AssetTypeMap, mapListings, "1.2.0", []string{"map-bin-only"}},
		{"maps compatible on a new game", types.AssetTypeMap, mapListings, "1.4.0", []string{}},
		{"undetected game version flags nothing", types.AssetTypeMod, modListings, "", []string{}},
		{"unparseable game version flags nothing", types.AssetTypeMod, modListings, "not-a-version", []string{}},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			reg := newTestRegistry(t)
			report := types.RegistryIntegrityReport{Listings: tc.listings}
			if tc.assetType == types.AssetTypeMod {
				reg.integrityMods = report
			} else {
				reg.integrityMaps = report
			}

			resp := reg.GameIncompatibleAssets(tc.assetType, tc.gameVersion)
			require.Equal(t, types.ResponseSuccess, resp.Status)
			require.Equal(t, tc.want, resp.AssetIDs)
		})
	}
}
