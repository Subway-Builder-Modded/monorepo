package registry

import (
	"testing"

	"railyard/internal/testutil"
	"railyard/internal/testutil/registrytest"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func TestFetchFromDiskCarriesMapDifficulty(t *testing.T) {
	testutil.NewHarness(t)
	withDifficulty := registrytest.MockMapManifestWithIDAndCode("map-hard", "AAA")
	withDifficulty.Difficulty = "very_hard"
	withoutDifficulty := registrytest.MockMapManifestWithIDAndCode("map-plain", "BBB")
	registrytest.WriteFixture(t, registrytest.RepositoryFixture{
		Maps: []types.MapManifest{withDifficulty, withoutDifficulty},
	})

	reg := newTestRegistry(t)
	require.NoError(t, reg.fetchFromDisk())

	hard, err := reg.GetMap("map-hard")
	require.NoError(t, err)
	require.Equal(t, "very_hard", hard.Difficulty)

	plain, err := reg.GetMap("map-plain")
	require.NoError(t, err)
	require.Empty(t, plain.Difficulty)
}
