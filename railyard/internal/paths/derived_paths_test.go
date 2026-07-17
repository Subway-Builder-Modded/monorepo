package paths

import (
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

// TestDerivedPathsAnchorUnderAppDataRoot pins every AppData-derived path to the shared root
// and its expected leaf name.
func TestDerivedPathsAnchorUnderAppDataRoot(t *testing.T) {
	root := AppDataRoot()
	require.True(t, strings.HasSuffix(root, AppDirName))

	cases := map[string]string{
		ProfileArchivesPath(): "profile_archives",
		RegistryRepoPath():    RegistryDirName,
		ConfigPath():          ConfigFileName,
		VersionsCachePath():   VersionsCacheFileName,
		TilesPath():           "tiles",
		InstalledModsPath():   InstalledModsFileName,
		InstalledMapsPath():   InstalledMapsFileName,
		UserProfilesPath():    UserProfilesFileName,
		LogFilePath():         LogFileName,
		PrevLogFilePath():     PrevLogFileName,
		LockFilePath():        LockFile,
		AppTmpStagingPath():   StagingDirName,
	}
	for path, leaf := range cases {
		require.Equal(t, filepath.Join(root, leaf), path)
	}
}

func TestMetroMakerDerivedPaths(t *testing.T) {
	dataRoot := filepath.Join("/data", "metro-maker4")
	require.Equal(t, filepath.Join(dataRoot, "mods"), MetroMakerModsPath(dataRoot))
	require.Equal(t, filepath.Join(dataRoot, "cities", "data"), MetroMakerMapsDataPath(dataRoot))
	require.Equal(t, filepath.Join(dataRoot, MetroMakerRailyardDirName, StagingDirName), MetroMakerTmpStagingPath(dataRoot))
}
