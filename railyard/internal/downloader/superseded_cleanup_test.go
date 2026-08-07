package downloader

import (
	"os"
	"testing"

	"railyard/internal/constants"
	"railyard/internal/paths"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

// writeSupersededMapArtifacts lays down the full on-disk artifact set for a city
// code: data directory (optionally marker-managed), tiles, foundation tiles, and
// thumbnail. Codes must be unique per test — the tiles directory is shared
// process-wide via the TestMain env root.
func writeSupersededMapArtifacts(t *testing.T, d *Downloader, code string, withMarker bool) (dataDir, tile, foundationTile, thumbnail string) {
	t.Helper()
	dataDir = paths.JoinLocalPath(d.getMapDataPath(), code)
	require.NoError(t, os.MkdirAll(dataDir, 0o755))
	if withMarker {
		require.NoError(t, os.WriteFile(paths.JoinLocalPath(dataDir, constants.RailyardAssetMarker), []byte(""), 0o644))
	}
	require.NoError(t, os.WriteFile(paths.JoinLocalPath(dataDir, "demand_data.json.gz"), []byte("{}"), 0o644))
	require.NoError(t, os.MkdirAll(d.getMapTilePath(), 0o755))
	require.NoError(t, os.MkdirAll(d.getMapThumbnailPath(), 0o755))
	tile = paths.JoinLocalPath(d.getMapTilePath(), code+".pmtiles")
	foundationTile = paths.JoinLocalPath(d.getMapTilePath(), code+"_foundations.pmtiles")
	thumbnail = paths.JoinLocalPath(d.getMapThumbnailPath(), code+".svg")
	require.NoError(t, os.WriteFile(tile, []byte("tiles"), 0o644))
	require.NoError(t, os.WriteFile(foundationTile, []byte("tiles"), 0o644))
	require.NoError(t, os.WriteFile(thumbnail, []byte("svg"), 0o644))
	return dataDir, tile, foundationTile, thumbnail
}

func TestCleanupSupersededMapArtifactsRemovesOldCodeArtifacts(t *testing.T) {
	d, reg, _ := newConfiguredDownloader(t, true)
	oldDir, tile, foundationTile, thumbnail := writeSupersededMapArtifacts(t, d, "OLDA", true)
	reg.AddInstalledMap("lyon", "2.0.0", false, types.ConfigData{Code: "NEWA"})

	d.cleanupSupersededMapArtifacts("lyon", "OLDA", "NEWA")

	require.NoDirExists(t, oldDir)
	require.NoFileExists(t, tile)
	require.NoFileExists(t, foundationTile)
	require.NoFileExists(t, thumbnail)
}

func TestCleanupSupersededMapArtifactsNoopWhenCodeUnchanged(t *testing.T) {
	d, reg, _ := newConfiguredDownloader(t, true)
	oldDir, tile, foundationTile, thumbnail := writeSupersededMapArtifacts(t, d, "SAMA", true)
	reg.AddInstalledMap("lyon", "2.0.0", false, types.ConfigData{Code: "SAMA"})

	d.cleanupSupersededMapArtifacts("lyon", "SAMA", "SAMA")

	require.DirExists(t, oldDir)
	require.FileExists(t, tile)
	require.FileExists(t, foundationTile)
	require.FileExists(t, thumbnail)
}

func TestCleanupSupersededMapArtifactsKeepsUnmarkedDataDir(t *testing.T) {
	d, reg, _ := newConfiguredDownloader(t, true)
	oldDir, tile, foundationTile, thumbnail := writeSupersededMapArtifacts(t, d, "OLDB", false)
	reg.AddInstalledMap("lyon", "2.0.0", false, types.ConfigData{Code: "NEWB"})

	d.cleanupSupersededMapArtifacts("lyon", "OLDB", "NEWB")

	// Without the Railyard marker the data directory may not be ours (e.g. the
	// old code now belongs to a vanilla city) — it must be left in place.
	require.DirExists(t, oldDir)
	require.FileExists(t, paths.JoinLocalPath(oldDir, "demand_data.json.gz"))
	// Tiles and thumbnails live in Railyard-managed directories and are removed.
	require.NoFileExists(t, tile)
	require.NoFileExists(t, foundationTile)
	require.NoFileExists(t, thumbnail)
}

func TestCleanupSupersededMapArtifactsSkipsWhenCodeOwnedByOtherInstall(t *testing.T) {
	d, reg, _ := newConfiguredDownloader(t, true)
	oldDir, tile, foundationTile, thumbnail := writeSupersededMapArtifacts(t, d, "OLDC", true)
	reg.AddInstalledMap("lyon", "2.0.0", false, types.ConfigData{Code: "NEWC"})
	reg.AddInstalledMap("other-local", "1.0.0", true, types.ConfigData{Code: "OLDC"})

	d.cleanupSupersededMapArtifacts("lyon", "OLDC", "NEWC")

	require.DirExists(t, oldDir)
	require.FileExists(t, tile)
	require.FileExists(t, foundationTile)
	require.FileExists(t, thumbnail)
}
