package files

import (
	"archive/zip"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"railyard/internal/paths"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func TestValidateMapArchive(t *testing.T) {
	requiredFiles := func(configCode string) map[string][]byte {
		return map[string][]byte{
			MapConfigFileName:    mustMapConfigJSON(t, configCode),
			MapDemandFileName:    []byte("{}"),
			MapRoadsFileName:     []byte("{}"),
			MapRunwaysFileName:   []byte("{}"),
			MapBuildingsFileName: []byte("{}"),
			"AAA.pmtiles":        []byte("tiles"),
		}
	}

	tests := []struct {
		name        string
		files       map[string][]byte
		wantErrType types.DownloaderErrorType
		wantErr     bool
		wantCode    string
	}{
		{
			name:        "valid archive",
			files:       requiredFiles("AAA"),
			wantErrType: "",
			wantErr:     false,
			wantCode:    "AAA",
		},
		{
			name: "valid archive with shared payload",
			files: func() map[string][]byte {
				f := requiredFiles("AAA")
				f[".railyard_map/data/example.json"] = []byte(`{"ok":true}`)
				return f
			}(),
			wantErrType: "",
			wantErr:     false,
			wantCode:    "AAA",
		},
		{
			name: "missing required file",
			files: func() map[string][]byte {
				f := requiredFiles("AAA")
				delete(f, MapRoadsFileName)
				return f
			}(),
			wantErrType: types.InstallErrorInvalidArchive,
			wantErr:     true,
		},
		{
			name: "valid archive with binary buildings index only",
			files: func() map[string][]byte {
				f := requiredFiles("AAA")
				delete(f, MapBuildingsFileName)
				f[MapBuildingsBinFileName+".gz"] = []byte("bin")
				return f
			}(),
			wantErrType: "",
			wantErr:     false,
			wantCode:    "AAA",
		},
		{
			name: "valid archive with both buildings index forms",
			files: func() map[string][]byte {
				f := requiredFiles("AAA")
				f[MapBuildingsBinFileName+".gz"] = []byte("bin")
				return f
			}(),
			wantErrType: "",
			wantErr:     false,
			wantCode:    "AAA",
		},
		{
			name: "missing both buildings index forms",
			files: func() map[string][]byte {
				f := requiredFiles("AAA")
				delete(f, MapBuildingsFileName)
				return f
			}(),
			wantErrType: types.InstallErrorInvalidArchive,
			wantErr:     true,
		},
		{
			name: "valid archive with gzipped payload files",
			files: func() map[string][]byte {
				f := requiredFiles("AAA")
				// Ship demand and the JSON buildings index gzipped instead of plain.
				delete(f, MapDemandFileName)
				f[MapDemandFileName+".gz"] = []byte("gz")
				delete(f, MapBuildingsFileName)
				f[MapBuildingsFileName+".gz"] = []byte("gz")
				return f
			}(),
			wantErrType: "",
			wantErr:     false,
			wantCode:    "AAA",
		},
		{
			name: "invalid config json",
			files: func() map[string][]byte {
				f := requiredFiles("AAA")
				f[MapConfigFileName] = []byte("{invalid")
				return f
			}(),
			wantErrType: types.InstallErrorInvalidManifest,
			wantErr:     true,
		},
		{
			name:        "invalid map code",
			files:       requiredFiles("dca"),
			wantErrType: types.InstallErrorInvalidMapCode,
			wantErr:     true,
		},
		{
			name: "missing tile file",
			files: func() map[string][]byte {
				f := requiredFiles("AAA")
				delete(f, "AAA.pmtiles")
				return f
			}(),
			wantErrType: types.InstallErrorInvalidArchive,
			wantErr:     true,
		},
		{
			name: "accepts shared payload with windows separators",
			files: func() map[string][]byte {
				f := requiredFiles("AAA")
				f[".railyard_map\\data\\example.json"] = []byte(`{"ok":true}`)
				return f
			}(),
			wantErrType: "",
			wantErr:     false,
			wantCode:    "AAA",
		},
		{
			name: "rejects nested shared payload folder",
			files: func() map[string][]byte {
				f := requiredFiles("AAA")
				f["nested/.railyard_map/data/example.json"] = []byte(`{"ok":true}`)
				return f
			}(),
			wantErrType: types.InstallErrorInvalidArchive,
			wantErr:     true,
		},
		{
			name: "rejects absolute shared payload path",
			files: func() map[string][]byte {
				f := requiredFiles("AAA")
				f["/.railyard_map/data/example.json"] = []byte(`{"ok":true}`)
				return f
			}(),
			wantErrType: types.InstallErrorInvalidArchive,
			wantErr:     true,
		},
		{
			name: "rejects unsafe shared payload path traversal",
			files: func() map[string][]byte {
				f := requiredFiles("AAA")
				f[".railyard_map/../data/example.json"] = []byte(`{"ok":true}`)
				return f
			}(),
			wantErrType: types.InstallErrorInvalidArchive,
			wantErr:     true,
		},
		{
			name: "rejects shared payload root file",
			files: func() map[string][]byte {
				f := requiredFiles("AAA")
				f[".railyard_map"] = []byte(`not-a-dir`)
				return f
			}(),
			wantErrType: types.InstallErrorInvalidArchive,
			wantErr:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			zipPath := writeZipArchive(t, tt.files)
			config, errType, err := ValidateMapArchive(zipPath)
			require.Equal(t, tt.wantErrType, errType)
			if tt.wantErr {
				require.Error(t, err)
				return
			}

			require.NoError(t, err)
			require.Equal(t, tt.wantCode, config.Code)
		})
	}
}

func TestValidateMapArchiveEnumeratesMissingFiles(t *testing.T) {
	// Only config + demand present; roads, runways, tiles and any buildings
	// index are omitted so a single validation pass should report them all.
	zipPath := writeZipArchive(t, map[string][]byte{
		MapConfigFileName: mustMapConfigJSON(t, "AAA"),
		MapDemandFileName: []byte("{}"),
	})

	_, errType, err := ValidateMapArchive(zipPath)
	require.Equal(t, types.InstallErrorInvalidArchive, errType)

	var missingErr *types.MissingFilesError
	require.ErrorAs(t, err, &missingErr)
	require.ElementsMatch(t, []string{
		MapRoadsFileName,
		MapRunwaysFileName,
		"map tiles (*" + MapTileFileExt + ")",
		"a buildings index (" + MapBuildingsFileName + " or " + MapBuildingsBinFileName + ")",
	}, missingErr.Files)
}

func TestValidateInstalledMapDataLocal(t *testing.T) {
	tests := []struct {
		name        string
		setup       func(t *testing.T, mapRoot, tilesRoot, cityCode string)
		wantErrType types.DownloaderErrorType
		wantErr     bool
		wantCode    string
	}{
		{
			name: "valid local installed map data",
			setup: func(t *testing.T, mapRoot, tilesRoot, cityCode string) {
				writeInstalledLocalMapFixture(t, mapRoot, tilesRoot, cityCode, "AAA")
			},
			wantErrType: "",
			wantErr:     false,
			wantCode:    "AAA",
		},
		{
			name: "missing config file",
			setup: func(t *testing.T, mapRoot, tilesRoot, cityCode string) {
				writeInstalledLocalMapFixture(t, mapRoot, tilesRoot, cityCode, "AAA")
				configPath := paths.JoinLocalPath(mapRoot, cityCode, MapConfigFileName)
				require.NoError(t, os.Remove(configPath))
			},
			wantErrType: types.InstallErrorInvalidArchive,
			wantErr:     true,
		},
		{
			name: "missing required gz file",
			setup: func(t *testing.T, mapRoot, tilesRoot, cityCode string) {
				writeInstalledLocalMapFixture(t, mapRoot, tilesRoot, cityCode, "AAA")
				roadsPath := paths.JoinLocalPath(mapRoot, cityCode, MapRoadsFileName+".gz")
				require.NoError(t, os.Remove(roadsPath))
			},
			wantErrType: types.InstallErrorInvalidArchive,
			wantErr:     true,
		},
		{
			name: "missing tile file",
			setup: func(t *testing.T, mapRoot, tilesRoot, cityCode string) {
				writeInstalledLocalMapFixture(t, mapRoot, tilesRoot, cityCode, "AAA")
				tilePath := paths.JoinLocalPath(tilesRoot, cityCode+MapTileFileExt)
				require.NoError(t, os.Remove(tilePath))
			},
			wantErrType: types.InstallErrorInvalidArchive,
			wantErr:     true,
		},
		{
			name: "invalid installed config json",
			setup: func(t *testing.T, mapRoot, tilesRoot, cityCode string) {
				writeInstalledLocalMapFixture(t, mapRoot, tilesRoot, cityCode, "AAA")
				configPath := paths.JoinLocalPath(mapRoot, cityCode, MapConfigFileName)
				require.NoError(t, os.WriteFile(configPath, []byte("{invalid"), 0o644))
			},
			wantErrType: types.InstallErrorInvalidManifest,
			wantErr:     true,
		},
		{
			name: "invalid installed config map code",
			setup: func(t *testing.T, mapRoot, tilesRoot, cityCode string) {
				writeInstalledLocalMapFixture(t, mapRoot, tilesRoot, cityCode, "aaa")
			},
			wantErrType: types.InstallErrorInvalidMapCode,
			wantErr:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mapRoot := t.TempDir()
			tilesRoot := t.TempDir()
			cityCode := "AAA"
			tt.setup(t, mapRoot, tilesRoot, cityCode)

			config, errType, err := ValidateInstalledMapData(mapRoot, tilesRoot, cityCode, true)
			require.Equal(t, tt.wantErrType, errType)
			if tt.wantErr {
				require.Error(t, err)
				return
			}

			require.NoError(t, err)
			require.Equal(t, tt.wantCode, config.Code)
		})
	}
}

func TestValidateInstalledMapDataDownloaded(t *testing.T) {
	tests := []struct {
		name        string
		setup       func(t *testing.T, mapRoot, tilesRoot, cityCode string)
		wantErrType types.DownloaderErrorType
		wantErr     bool
	}{
		{
			name: "valid downloaded installed map data",
			setup: func(t *testing.T, mapRoot, tilesRoot, cityCode string) {
				writeInstalledDownloadedMapFixture(t, mapRoot, tilesRoot, cityCode)
			},
			wantErrType: "",
			wantErr:     false,
		},
		{
			name: "missing required file",
			setup: func(t *testing.T, mapRoot, tilesRoot, cityCode string) {
				writeInstalledDownloadedMapFixture(t, mapRoot, tilesRoot, cityCode)
				demandPath := paths.JoinLocalPath(mapRoot, cityCode, MapDemandFileName+".gz")
				require.NoError(t, os.Remove(demandPath))
			},
			wantErrType: types.InstallErrorInvalidArchive,
			wantErr:     true,
		},
		{
			name: "valid with binary buildings index only",
			setup: func(t *testing.T, mapRoot, tilesRoot, cityCode string) {
				writeInstalledDownloadedMapFixture(t, mapRoot, tilesRoot, cityCode)
				require.NoError(t, os.Remove(paths.JoinLocalPath(mapRoot, cityCode, MapBuildingsFileName+".gz")))
				require.NoError(t, os.WriteFile(paths.JoinLocalPath(mapRoot, cityCode, MapBuildingsBinFileName+".gz"), []byte("bin"), 0o644))
			},
			wantErrType: "",
			wantErr:     false,
		},
		{
			name: "missing both buildings index forms",
			setup: func(t *testing.T, mapRoot, tilesRoot, cityCode string) {
				writeInstalledDownloadedMapFixture(t, mapRoot, tilesRoot, cityCode)
				require.NoError(t, os.Remove(paths.JoinLocalPath(mapRoot, cityCode, MapBuildingsFileName+".gz")))
			},
			wantErrType: types.InstallErrorInvalidArchive,
			wantErr:     true,
		},
		{
			name: "missing tile file",
			setup: func(t *testing.T, mapRoot, tilesRoot, cityCode string) {
				writeInstalledDownloadedMapFixture(t, mapRoot, tilesRoot, cityCode)
				tilePath := paths.JoinLocalPath(tilesRoot, cityCode+MapTileFileExt)
				require.NoError(t, os.Remove(tilePath))
			},
			wantErrType: types.InstallErrorInvalidArchive,
			wantErr:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mapRoot := t.TempDir()
			tilesRoot := t.TempDir()
			cityCode := "AAA"
			tt.setup(t, mapRoot, tilesRoot, cityCode)

			_, errType, err := ValidateInstalledMapData(mapRoot, tilesRoot, cityCode, false)
			require.Equal(t, tt.wantErrType, errType)
			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
		})
	}
}

func TestBuildMapArchiveFileIndexTileClassification(t *testing.T) {
	// Test the classification logic for distinguishing foundation tiles from regular tiles.
	// This verifies lines 90-94 in map_validation.go: files ending with _foundations.pmtiles
	// are marked as foundation tiles, while files with .pmtiles extension are marked as tiles.

	tests := []struct {
		name              string
		files             map[string][]byte
		expectTiles       bool
		expectFoundations bool
	}{
		{
			name: "regular tiles only",
			files: map[string][]byte{
				MapConfigFileName:    mustMapConfigJSON(t, "AAA"),
				MapDemandFileName:    []byte("{}"),
				MapRoadsFileName:     []byte("{}"),
				MapRunwaysFileName:   []byte("{}"),
				MapBuildingsFileName: []byte("{}"),
				"AAA.pmtiles":        []byte("regular-tiles"),
			},
			expectTiles:       true,
			expectFoundations: false,
		},
		{
			name: "foundation tiles only",
			files: map[string][]byte{
				MapConfigFileName:         mustMapConfigJSON(t, "BBB"),
				MapDemandFileName:         []byte("{}"),
				MapRoadsFileName:          []byte("{}"),
				MapRunwaysFileName:        []byte("{}"),
				MapBuildingsFileName:      []byte("{}"),
				"BBB_foundations.pmtiles": []byte("foundation-tiles"),
			},
			expectTiles:       false,
			expectFoundations: true,
		},
		{
			name: "both regular and foundation tiles",
			files: map[string][]byte{
				MapConfigFileName:         mustMapConfigJSON(t, "CCC"),
				MapDemandFileName:         []byte("{}"),
				MapRoadsFileName:          []byte("{}"),
				MapRunwaysFileName:        []byte("{}"),
				MapBuildingsFileName:      []byte("{}"),
				"CCC.pmtiles":             []byte("regular-tiles-data"),
				"CCC_foundations.pmtiles": []byte("foundation-tiles-data"),
			},
			expectTiles:       true,
			expectFoundations: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			zipPath := writeZipArchive(t, tt.files)
			file, err := zip.OpenReader(zipPath)
			require.NoError(t, err)
			defer file.Close()

			filesFound := BuildMapArchiveFileIndex(file.File)

			if tt.expectTiles {
				require.True(t, filesFound[MapArchiveKeyTiles].Found, "expected MapArchiveKeyTiles to be found")
				require.NotNil(t, filesFound[MapArchiveKeyTiles].FileObject)
			}
			if tt.expectFoundations {
				require.True(t, filesFound[MapArchiveKeyFoundationTiles].Found, "expected MapArchiveKeyFoundationTiles to be found")
				require.NotNil(t, filesFound[MapArchiveKeyFoundationTiles].FileObject)
			}
		})
	}
}

func mustMapConfigJSON(t *testing.T, code string) []byte {
	t.Helper()
	cfg := types.ConfigData{
		Code:    code,
		Name:    "Test Map",
		Version: "1.0.0",
	}
	data, err := json.Marshal(cfg)
	require.NoError(t, err)
	return data
}

func writeZipArchive(t *testing.T, files map[string][]byte) string {
	t.Helper()
	zipPath := filepath.Join(t.TempDir(), "map.zip")
	file, err := os.Create(zipPath)
	require.NoError(t, err)
	defer file.Close()

	zipWriter := zip.NewWriter(file)
	for name, content := range files {
		entry, createErr := zipWriter.Create(name)
		require.NoError(t, createErr)
		_, writeErr := entry.Write(content)
		require.NoError(t, writeErr)
	}
	require.NoError(t, zipWriter.Close())
	return zipPath
}

func writeInstalledDownloadedMapFixture(t *testing.T, mapRoot, tilesRoot, cityCode string) {
	t.Helper()
	cityPath := paths.JoinLocalPath(mapRoot, cityCode)
	require.NoError(t, os.MkdirAll(cityPath, 0o755))
	require.NoError(t, os.MkdirAll(tilesRoot, 0o755))
	require.NoError(t, os.WriteFile(paths.JoinLocalPath(cityPath, MapConfigFileName), mustMapConfigJSON(t, cityCode), 0o644))
	require.NoError(t, os.WriteFile(paths.JoinLocalPath(cityPath, MapDemandFileName+".gz"), []byte("{}"), 0o644))
	require.NoError(t, os.WriteFile(paths.JoinLocalPath(cityPath, MapRoadsFileName+".gz"), []byte("{}"), 0o644))
	require.NoError(t, os.WriteFile(paths.JoinLocalPath(cityPath, MapRunwaysFileName+".gz"), []byte("{}"), 0o644))
	require.NoError(t, os.WriteFile(paths.JoinLocalPath(cityPath, MapBuildingsFileName+".gz"), []byte("{}"), 0o644))
	require.NoError(t, os.WriteFile(paths.JoinLocalPath(tilesRoot, cityCode+MapTileFileExt), []byte("tiles"), 0o644))
}

func writeInstalledLocalMapFixture(t *testing.T, mapRoot, tilesRoot, cityCode, configCode string) {
	t.Helper()
	writeInstalledDownloadedMapFixture(t, mapRoot, tilesRoot, cityCode)
	configPath := paths.JoinLocalPath(mapRoot, cityCode, MapConfigFileName)
	require.NoError(t, os.WriteFile(configPath, mustMapConfigJSON(t, configCode), 0o644))
}
