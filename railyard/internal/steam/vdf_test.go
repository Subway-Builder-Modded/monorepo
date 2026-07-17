package steam

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

// newSteamapps creates <root>/steamapps and returns its path.
func newSteamapps(t *testing.T) string {
	t.Helper()
	steamapps := filepath.Join(t.TempDir(), "steamapps")
	require.NoError(t, os.MkdirAll(steamapps, 0o755))
	return steamapps
}

// installGame writes the game's appmanifest and install directory under a steamapps directory.
func installGame(t *testing.T, steamapps string) string {
	t.Helper()
	manifest := filepath.Join(steamapps, "appmanifest_"+SubwayBuilderAppID+".acf")
	require.NoError(t, os.WriteFile(manifest, []byte("\"AppState\"\n{\n}\n"), 0o644))
	gameDir := filepath.Join(steamapps, "common", subwayBuilderInstallDir)
	require.NoError(t, os.MkdirAll(gameDir, 0o755))
	return gameDir
}

// writeLibraryFolders writes a libraryfolders.vdf listing the given library roots. The apps maps
// are intentionally left empty: detection must rely on appmanifests, not the stale apps map.
func writeLibraryFolders(t *testing.T, steamapps string, libraryRoots ...string) {
	t.Helper()
	var b strings.Builder
	b.WriteString("\"libraryfolders\"\n{\n")
	for i, root := range libraryRoots {
		escaped := strings.ReplaceAll(root, `\`, `\\`)
		b.WriteString("\t\"" + string(rune('0'+i)) + "\"\n\t{\n")
		b.WriteString("\t\t\"path\"\t\t\"" + escaped + "\"\n")
		b.WriteString("\t\t\"apps\"\n\t\t{\n\t\t}\n")
		b.WriteString("\t}\n")
	}
	b.WriteString("}\n")
	vdfPath := filepath.Join(steamapps, "libraryfolders.vdf")
	require.NoError(t, os.WriteFile(vdfPath, []byte(b.String()), 0o644))
}

func TestAutodetectFindsGameInGivenSteamapps(t *testing.T) {
	steamapps := newSteamapps(t)
	gameDir := installGame(t, steamapps)

	found, err := AutodetectSteamSubwayBuilderPath(steamapps)
	require.NoError(t, err)
	require.Equal(t, gameDir, found)
}

func TestAutodetectFindsGameInSecondaryLibraryDespiteEmptyAppsMap(t *testing.T) {
	steamapps := newSteamapps(t)
	secondary := newSteamapps(t)
	gameDir := installGame(t, secondary)
	writeLibraryFolders(t, steamapps, filepath.Dir(steamapps), filepath.Dir(secondary))

	found, err := AutodetectSteamSubwayBuilderPath(steamapps)
	require.NoError(t, err)
	require.Equal(t, gameDir, found)
}

func TestAutodetectErrorsWhenGameNotInstalled(t *testing.T) {
	steamapps := newSteamapps(t)
	writeLibraryFolders(t, steamapps, filepath.Dir(steamapps))

	_, err := AutodetectSteamSubwayBuilderPath(steamapps)
	require.ErrorIs(t, err, ErrGameNotInstalled)
}

func TestAutodetectErrorsWhenLibraryFoldersMissing(t *testing.T) {
	steamapps := newSteamapps(t)

	_, err := AutodetectSteamSubwayBuilderPath(steamapps)
	require.Error(t, err)
	require.NotErrorIs(t, err, ErrGameNotInstalled)
}

func TestAutodetectIgnoresManifestWithoutInstallDir(t *testing.T) {
	steamapps := newSteamapps(t)
	manifest := filepath.Join(steamapps, "appmanifest_"+SubwayBuilderAppID+".acf")
	require.NoError(t, os.WriteFile(manifest, []byte("\"AppState\"\n{\n}\n"), 0o644))
	writeLibraryFolders(t, steamapps, filepath.Dir(steamapps))

	_, err := AutodetectSteamSubwayBuilderPath(steamapps)
	require.ErrorIs(t, err, ErrGameNotInstalled)
}
