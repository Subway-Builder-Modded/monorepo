package files

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestMapArtifactsManifestIsWellFormed(t *testing.T) {
	seenKeys := map[string]struct{}{}
	seenEntryNames := map[string]struct{}{}
	seenInstalledNames := map[string]struct{}{}

	for _, artifact := range MapArtifacts {
		require.NotEmpty(t, artifact.ArchiveKey)
		require.NotEmpty(t, artifact.Suffix)
		require.NotEmpty(t, artifact.ProfileEntryName)
		require.NotEmpty(t, artifact.Label)

		_, dupKey := seenKeys[artifact.ArchiveKey]
		require.False(t, dupKey, "duplicate archive key %q", artifact.ArchiveKey)
		seenKeys[artifact.ArchiveKey] = struct{}{}

		_, dupEntry := seenEntryNames[artifact.ProfileEntryName]
		require.False(t, dupEntry, "duplicate profile entry name %q", artifact.ProfileEntryName)
		seenEntryNames[artifact.ProfileEntryName] = struct{}{}

		installedName := fmt.Sprintf("%d:%s", artifact.Root, artifact.Suffix)
		_, dupInstalled := seenInstalledNames[installedName]
		require.False(t, dupInstalled, "duplicate installed destination %q", installedName)
		seenInstalledNames[installedName] = struct{}{}

		require.True(t, IsMapArtifactKey(artifact.ArchiveKey))
	}

	require.False(t, IsMapArtifactKey(MapArchiveKeyConfig))
	require.False(t, IsMapArtifactKey(MapArchiveKeyDemandData))
}
