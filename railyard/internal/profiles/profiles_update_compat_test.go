package profiles

import (
	"testing"

	"railyard/internal/testutil"
	"railyard/internal/types"

	semver "github.com/Masterminds/semver/v3"
	"github.com/stretchr/testify/require"
)

func TestGameVersionSatisfiesRange(t *testing.T) {
	gameVersion := semver.MustParse("1.3.0")

	require.True(t, gameVersionSatisfiesRange(gameVersion, ""), "empty range imposes no requirement")
	require.True(t, gameVersionSatisfiesRange(gameVersion, ">=1.0.0"))
	require.False(t, gameVersionSatisfiesRange(gameVersion, ">=1.4.0"))
	require.True(t, gameVersionSatisfiesRange(gameVersion, "not-a-range"), "unparseable range must not hide an update")
}

func TestFilterGameCompatibleVersionsPicksLatestCompatible(t *testing.T) {
	gameVersion := semver.MustParse("1.3.0")
	versions := []types.VersionInfo{
		{Version: "2.0.0", GameVersion: ">=1.4.0"}, // newest, but incompatible
		{Version: "1.5.0", GameVersion: ">=1.0.0"}, // compatible
		{Version: "1.2.0"},                         // no requirement → compatible
	}

	compatible := filterGameCompatibleVersions(types.AssetTypeMod, versions, gameVersion)
	require.Len(t, compatible, 2)

	latest, err := latestSemverVersion(compatible)
	require.NoError(t, err)
	require.Equal(t, "1.5.0", latest, "should resolve to the latest compatible version, not the absolute latest")
}

func TestFilterGameCompatibleVersionsMapBuildingsConstraint(t *testing.T) {
	gameVersion := semver.MustParse("1.3.0")
	versions := []types.VersionInfo{
		{Version: "2.0.0", MapBuildingsConstraint: "<1.3.0"},  // incompatible buildings index
		{Version: "1.5.0", MapBuildingsConstraint: ">=1.3.0"}, // compatible
	}

	// Maps enforce the buildings-index constraint.
	mapCompatible := filterGameCompatibleVersions(types.AssetTypeMap, versions, gameVersion)
	require.Len(t, mapCompatible, 1)
	require.Equal(t, "1.5.0", mapCompatible[0].Version)

	// Mods ignore the buildings-index constraint (it is always empty for mods).
	modCompatible := filterGameCompatibleVersions(types.AssetTypeMod, versions, gameVersion)
	require.Len(t, modCompatible, 2)
}

func TestFilterGameCompatibleVersionsNoneCompatible(t *testing.T) {
	gameVersion := semver.MustParse("1.3.0")
	versions := []types.VersionInfo{
		{Version: "2.0.0", GameVersion: ">=1.4.0"},
		{Version: "2.1.0", GameVersion: ">=1.5.0"},
	}
	require.Empty(t, filterGameCompatibleVersions(types.AssetTypeMod, versions, gameVersion))
}

func TestIsSemverUpgrade(t *testing.T) {
	upgrade, err := isSemverUpgrade("2.0.0", "1.0.0")
	require.NoError(t, err)
	require.True(t, upgrade)

	same, err := isSemverUpgrade("1.0.0", "1.0.0")
	require.NoError(t, err)
	require.False(t, same, "same version is not an upgrade")

	downgrade, err := isSemverUpgrade("1.0.0", "2.0.0")
	require.NoError(t, err)
	require.False(t, downgrade, "a lower compatible version is not an upgrade")

	prefixed, err := isSemverUpgrade("v2.0.0", "1.0.0")
	require.NoError(t, err)
	require.True(t, prefixed, "tolerates a v prefix")
}

func TestUpdateSubscriptionsToLatestUndetectedGameVersionShowsNoUpdates(t *testing.T) {
	testutil.NewHarness(t)

	state := types.InitialProfilesState()
	profile := state.Profiles[types.DefaultProfileID]
	profile.Subscriptions.Maps["map-a"] = "1.0.0"
	profile.Subscriptions.Mods["mod-a"] = "1.0.0"
	state.Profiles[types.DefaultProfileID] = profile

	svc, _, reg := loadedUserProfilesServiceWithDependencies(t, state)
	cleanup := mockRegistry(t, reg, []registryFixture{
		{assetID: "map-a", assetType: types.AssetTypeMap, versions: []string{"1.0.0", "2.0.0"}, mapCode: "AAA"},
		{assetID: "mod-a", assetType: types.AssetTypeMod, versions: []string{"1.0.0", "1.5.0"}},
	})
	defer cleanup()

	// Hard rule: an undetected game version must never advertise an update.
	svc.Downloader.GetGameVersion = func() types.GameVersionResponse {
		return types.GameVersionResponse{GenericResponse: types.ErrorResponse("game not found")}
	}

	result := svc.UpdateSubscriptionsToLatest(types.UpdateSubscriptionsToLatestRequest{
		ProfileID: types.DefaultProfileID,
		Apply:     false,
	})

	require.False(t, result.HasUpdates)
	require.Equal(t, 0, result.PendingCount)
	require.Empty(t, result.PendingUpdates)
}
