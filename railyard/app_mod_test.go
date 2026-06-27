package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"railyard/internal/config"
	"railyard/internal/files"
	"railyard/internal/logger"
	"railyard/internal/paths"
	"railyard/internal/registry"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func TestGameSupportsBinaryBuildings(t *testing.T) {
	success := func(version string) types.GameVersionResponse {
		return types.GameVersionResponse{GenericResponse: types.SuccessResponse("ok"), Version: version}
	}

	tests := []struct {
		name string
		resp types.GameVersionResponse
		want bool
	}{
		{"newer than floor", success("1.4.0"), true},
		{"newer with v prefix", success("v1.4.0"), true},
		{"much newer", success("2.0.0"), true},
		{"exactly the floor is json", success("1.3.0"), false},
		{"older than floor", success("1.2.0"), false},
		{"undetected version", types.GameVersionResponse{GenericResponse: types.WarnResponse("not detected"), Version: ""}, false},
		{"success but empty version", success(""), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			require.Equal(t, tt.want, preferBinaryBuildingsIndex(tt.resp))
		})
	}
}

func TestChooseBuildingsIndexStem(t *testing.T) {
	const code = "AAA"

	writeBin := func(t *testing.T) string {
		t.Helper()
		root := t.TempDir()
		dir := paths.JoinLocalPath(root, code)
		require.NoError(t, os.MkdirAll(dir, 0o755))
		require.NoError(t, os.WriteFile(paths.JoinLocalPath(dir, files.MapBuildingsBinFileName+".gz"), []byte("bin"), 0o644))
		return root
	}
	writeJSON := func(t *testing.T) string {
		t.Helper()
		root := t.TempDir()
		dir := paths.JoinLocalPath(root, code)
		require.NoError(t, os.MkdirAll(dir, 0o755))
		require.NoError(t, os.WriteFile(paths.JoinLocalPath(dir, files.MapBuildingsFileName+".gz"), []byte("json"), 0o644))
		return root
	}
	writeBoth := func(t *testing.T) string {
		t.Helper()
		root := t.TempDir()
		dir := paths.JoinLocalPath(root, code)
		require.NoError(t, os.MkdirAll(dir, 0o755))
		require.NoError(t, os.WriteFile(paths.JoinLocalPath(dir, files.MapBuildingsBinFileName+".gz"), []byte("bin"), 0o644))
		require.NoError(t, os.WriteFile(paths.JoinLocalPath(dir, files.MapBuildingsFileName+".gz"), []byte("json"), 0o644))
		return root
	}

	t.Run("binary game + binary present → binary, no error", func(t *testing.T) {
		root := writeBin(t)
		stem, err := setBuildingsIndexStem(root, code, true)
		require.NoError(t, err)
		require.Equal(t, files.MapBuildingsBinFileName, stem)
	})

	t.Run("binary game + JSON only → error", func(t *testing.T) {
		root := writeJSON(t)
		stem, err := setBuildingsIndexStem(root, code, true)
		require.Error(t, err)
		require.Empty(t, stem)
	})

	t.Run("JSON game + JSON present → JSON, no error", func(t *testing.T) {
		root := writeJSON(t)
		stem, err := setBuildingsIndexStem(root, code, false)
		require.NoError(t, err)
		require.Equal(t, files.MapBuildingsFileName, stem)
	})

	t.Run("JSON game + binary only → error", func(t *testing.T) {
		root := writeBin(t)
		stem, err := setBuildingsIndexStem(root, code, false)
		require.Error(t, err)
		require.Empty(t, stem)
	})

	t.Run("binary game + both present → binary, no error", func(t *testing.T) {
		root := writeBoth(t)
		stem, err := setBuildingsIndexStem(root, code, true)
		require.NoError(t, err)
		require.Equal(t, files.MapBuildingsBinFileName, stem)
	})

	t.Run("JSON game + both present → JSON, no error", func(t *testing.T) {
		root := writeBoth(t)
		stem, err := setBuildingsIndexStem(root, code, false)
		require.NoError(t, err)
		require.Equal(t, files.MapBuildingsFileName, stem)
	})
}

// newModTestApp creates a minimal App for generateMod tests. It uses the given
// MetroMakerDataPath and pre-populates the registry with the provided maps.
// Game version detection is left unconfigured, so preferBinary resolves to false
// (no executable path set), which makes "binary-only" maps the incompatible case.
func newModTestApp(t *testing.T, metroMakerDataPath string, maps []types.InstalledMapInfo) *App {
	t.Helper()
	l := logger.LoggerAtPath("")
	cfg := config.NewConfig(l)
	cfg.Cfg.MetroMakerDataPath = metroMakerDataPath
	reg := registry.NewRegistry(l, cfg)
	for _, m := range maps {
		reg.AddInstalledMap(m.ID, m.Version, m.IsLocal, m.MapConfig)
	}
	return &App{Logger: l, Config: cfg, Registry: reg}
}

// readGeneratedModConfig parses the MetroMakerModConfig from a generated index.js file.
func readGeneratedModConfig(t *testing.T, indexPath string) types.MetroMakerModConfig {
	t.Helper()
	raw, err := os.ReadFile(indexPath)
	require.NoError(t, err)
	// index.js starts with: const config = {...};
	s := strings.TrimPrefix(string(raw), "const config = ")
	var cfg types.MetroMakerModConfig
	require.NoError(t, json.NewDecoder(strings.NewReader(s)).Decode(&cfg))
	return cfg
}

func TestGenerateMod(t *testing.T) {
	const compatCode = "compat-map"
	const incompatCode = "incompat-map"

	// setupMaps writes map data files and returns the populated InstalledMapInfo slice.
	// No executable is configured so GetGameVersion returns not-detected → preferBinary=false.
	// That means: JSON files are compatible, binary-only files are incompatible.
	setupMaps := func(t *testing.T, dir string) []types.InstalledMapInfo {
		t.Helper()
		mapDataRoot := filepath.Join(dir, "cities", "data")

		compatDir := filepath.Join(mapDataRoot, compatCode)
		require.NoError(t, os.MkdirAll(compatDir, 0o755))
		require.NoError(t, os.WriteFile(filepath.Join(compatDir, files.MapBuildingsFileName+".gz"), []byte("json"), 0o644))

		incompatDir := filepath.Join(mapDataRoot, incompatCode)
		require.NoError(t, os.MkdirAll(incompatDir, 0o755))
		require.NoError(t, os.WriteFile(filepath.Join(incompatDir, files.MapBuildingsBinFileName+".gz"), []byte("bin"), 0o644))

		return []types.InstalledMapInfo{
			{ID: compatCode, Version: "1.0.0", MapConfig: types.ConfigData{Code: compatCode}},
			{ID: incompatCode, Version: "1.0.0", MapConfig: types.ConfigData{Code: incompatCode}},
		}
	}

	indexPath := func(dir string) string {
		return filepath.Join(dir, "mods", "mapLoader", "index.js")
	}

	t.Run("skipIncompatibleMaps=true excludes binary-only map", func(t *testing.T) {
		dir := t.TempDir()
		maps := setupMaps(t, dir)
		app := newModTestApp(t, dir, maps)

		require.NoError(t, app.generateMod(0, true))

		cfg := readGeneratedModConfig(t, indexPath(dir))
		codes := make([]string, 0, len(cfg.Places))
		for _, p := range cfg.Places {
			codes = append(codes, p.ConfigData.Code)
		}
		require.Contains(t, codes, compatCode)
		require.NotContains(t, codes, incompatCode)
	})

	t.Run("skipIncompatibleMaps=false includes binary-only map with JSON fallback", func(t *testing.T) {
		dir := t.TempDir()
		maps := setupMaps(t, dir)
		app := newModTestApp(t, dir, maps)

		require.NoError(t, app.generateMod(0, false))

		cfg := readGeneratedModConfig(t, indexPath(dir))
		codes := make([]string, 0, len(cfg.Places))
		stemByCode := make(map[string]string)
		for _, p := range cfg.Places {
			codes = append(codes, p.ConfigData.Code)
			stemByCode[p.ConfigData.Code] = p.BuildingsIndexFile
		}
		require.Contains(t, codes, compatCode)
		require.Contains(t, codes, incompatCode)
		require.Equal(t, files.MapBuildingsFileName, stemByCode[incompatCode])
	})
}
