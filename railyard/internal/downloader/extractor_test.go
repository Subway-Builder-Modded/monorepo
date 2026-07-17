package downloader

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"sync/atomic"
	"testing"

	"railyard/internal/files"
	"railyard/internal/paths"
	"railyard/internal/testutil/registrytest"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func TestMapEntryStagedTarget(t *testing.T) {
	const staging = "staging"

	tests := []struct {
		name      string
		key       string
		entryName string
		wantBase  string
		wantGzip  bool
	}{
		{
			name:      "config kept uncompressed for bootstrapping",
			key:       files.MapArchiveKeyConfig,
			entryName: files.MapConfigFileName,
			wantBase:  files.MapConfigFileName,
			wantGzip:  false,
		},
		{
			name:      "uncompressed json is gzipped on the way in",
			key:       files.MapArchiveKeyBuildings,
			entryName: files.MapBuildingsFileName,
			wantBase:  files.MapBuildingsFileName + ".gz",
			wantGzip:  true,
		},
		{
			name:      "already-gzipped binary is stored verbatim",
			key:       files.MapArchiveKeyBuildingsBin,
			entryName: files.MapBuildingsBinFileName + ".gz",
			wantBase:  files.MapBuildingsBinFileName + ".gz",
			wantGzip:  false,
		},
		{
			name:      "already-gzipped json is stored verbatim (no double-gzip)",
			key:       files.MapArchiveKeyBuildings,
			entryName: files.MapBuildingsFileName + ".gz",
			wantBase:  files.MapBuildingsFileName + ".gz",
			wantGzip:  false,
		},
		{
			name:      "uncompressed demand data is gzipped",
			key:       files.MapArchiveKeyDemandData,
			entryName: files.MapDemandFileName,
			wantBase:  files.MapDemandFileName + ".gz",
			wantGzip:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dest, gzipStream := mapEntryStagedTarget(tt.key, tt.entryName, staging)
			require.Equal(t, tt.wantGzip, gzipStream)
			require.Equal(t, paths.JoinLocalPath(staging, tt.wantBase), dest)
		})
	}
}

// zipReaderFromBytes opens in-memory zip data for direct helper tests.
func zipReaderFromBytes(t *testing.T, data []byte) *zip.Reader {
	t.Helper()
	reader, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	require.NoError(t, err)
	return reader
}

func TestSharedAssetPayloadHelpersRejectAbsoluteEntries(t *testing.T) {
	data := registrytest.MockZip(t, map[string][]byte{
		"/.railyard_map/data.json": []byte("{}"),
	})
	reader := zipReaderFromBytes(t, data)

	_, err := countSharedAssetPayloadFiles(types.AssetTypeMap, reader.File)
	require.ErrorContains(t, err, "must not be absolute")

	var progress atomic.Int64
	err = copySharedAssetPayload(types.AssetTypeMap, t.TempDir(), reader.File, "map-a", &progress, 1, nil)
	require.ErrorContains(t, err, "must not be absolute")
}

func TestCopySharedAssetPayloadRootMustBeDirectory(t *testing.T) {
	data := registrytest.MockZip(t, map[string][]byte{
		files.SharedAssetPayloadDir(types.AssetTypeMap): []byte("file at payload root"),
	})
	reader := zipReaderFromBytes(t, data)

	var progress atomic.Int64
	err := copySharedAssetPayload(types.AssetTypeMap, t.TempDir(), reader.File, "map-a", &progress, 1, nil)
	require.ErrorContains(t, err, "must be a directory")
}

func TestImportMapCopiesExplicitPayloadDirectories(t *testing.T) {
	d, _, _ := newConfiguredDownloader(t, true)

	configJSON, err := json.Marshal(types.ConfigData{Code: "PDR", Name: "Payload Dirs"})
	require.NoError(t, err)
	archive := registrytest.MockZip(t, map[string][]byte{
		"config.json":                   configJSON,
		"demand_data.json":              []byte("{}"),
		"roads.geojson":                 []byte(`{"type":"FeatureCollection","features":[]}`),
		"runways_taxiways.geojson":      []byte(`{"type":"FeatureCollection","features":[]}`),
		"buildings_index.json":          []byte("{}"),
		"tiles.pmtiles":                 []byte("tiles"),
		"thumbnail.svg":                 []byte("<svg></svg>"),
		".railyard_map/":                nil,
		".railyard_map/nested/":         nil,
		".railyard_map/nested/file.txt": []byte("payload"),
	})
	zipPath := filepath.Join(t.TempDir(), "payload-dirs.zip")
	require.NoError(t, os.WriteFile(zipPath, archive, 0o644))

	resp := d.ImportAsset(types.AssetTypeMap, zipPath, false)
	require.Equal(t, types.ResponseSuccess, resp.Status, resp.Message)

	helperRoot := filepath.Join(d.getMapDataPath(), "PDR", ".railyard_map")
	nestedInfo, err := os.Stat(filepath.Join(helperRoot, "nested"))
	require.NoError(t, err)
	require.True(t, nestedInfo.IsDir())
	payload, err := os.ReadFile(filepath.Join(helperRoot, "nested", "file.txt"))
	require.NoError(t, err)
	require.Equal(t, "payload", string(payload))
}

func TestInstallModArchiveWithDirectoryEntries(t *testing.T) {
	d, reg, _ := newConfiguredDownloader(t, true)

	manifest, err := json.Marshal(types.MetroMakerModManifest{Id: "mod-dirs", Name: "Mod Dirs", Version: "1.0.0", Main: "index.js"})
	require.NoError(t, err)
	archive := registrytest.MockZip(t, map[string][]byte{
		"manifest.json": manifest,
		"index.js":      []byte("export default {};"),
		"lib/":          nil,
		"lib/util.js":   []byte("export const x = 1;"),
	})
	cleanup := registrytest.MockRegistryServer(t, reg, []registrytest.UpdateFixture{
		{AssetID: "mod-dirs", AssetType: types.AssetTypeMod, Versions: []string{"1.0.0"}, ArchiveBytes: archive},
	})
	defer cleanup()

	resp := d.InstallAsset(types.InstallAssetRequest{AssetType: types.AssetTypeMod, AssetID: "mod-dirs", Version: "1.0.0"})
	require.Equal(t, types.ResponseSuccess, resp.Status, resp.Message)

	utilJS, err := os.ReadFile(filepath.Join(d.getModPath(), "mod-dirs", "lib", "util.js"))
	require.NoError(t, err)
	require.Equal(t, "export const x = 1;", string(utilJS))
}

func TestExtractMapInspectFailure(t *testing.T) {
	d, _, _ := newConfiguredDownloader(t, true)

	resp := extractMap(d, filepath.Join(t.TempDir(), "missing.zip"), "map-a", "1.0.0", false)
	require.Equal(t, types.ResponseError, resp.Status)
	require.Equal(t, types.InstallErrorInvalidArchive, resp.ErrorType)
}

func TestExtractMapConflictDetectedAtExtractTime(t *testing.T) {
	d, reg, _ := newConfiguredDownloader(t, true)
	reg.AddInstalledMap("other-map", "1.0.0", false, types.ConfigData{Code: "AAA"})

	zipPath := filepath.Join(t.TempDir(), "conflict-map.zip")
	require.NoError(t, os.WriteFile(zipPath, registrytest.MockMapZip(t, "AAA"), 0o644))

	resp := extractMap(d, zipPath, "map-new", "1.0.0", false)
	require.Equal(t, types.ResponseError, resp.Status)
	require.Equal(t, types.InstallErrorMapCodeConflict, resp.ErrorType)
	require.Contains(t, resp.Message, "already installed map")
}
