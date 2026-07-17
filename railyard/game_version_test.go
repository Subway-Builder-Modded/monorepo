package main

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"testing"
	"time"

	"railyard/internal/config"
	"railyard/internal/constants"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

// writeAsarWithFiles builds a minimal asar archive in the layout asar.Decode expects: two
// little-endian pickle frames (a 4-byte size frame, then the JSON index padded to 4 bytes)
// followed by the concatenated file contents. The library's own Builder miscounts its header
// sizes and cannot round-trip, so the fixture is written by hand.
func writeAsarWithFiles(t *testing.T, asarPath string, files map[string]string) {
	t.Helper()
	require.NoError(t, os.MkdirAll(filepath.Dir(asarPath), 0o755))

	names := make([]string, 0, len(files))
	for name := range files {
		names = append(names, name)
	}
	sort.Strings(names)

	entries := make(map[string]any, len(files))
	var contents bytes.Buffer
	for _, name := range names {
		entries[name] = map[string]any{
			"size":   len(files[name]),
			"offset": strconv.Itoa(contents.Len()),
		}
		contents.WriteString(files[name])
	}
	headerJSON, err := json.Marshal(map[string]any{"files": entries})
	require.NoError(t, err)
	padded := append(headerJSON, make([]byte, (4-len(headerJSON)%4)%4)...)

	var archive bytes.Buffer
	for _, v := range []uint32{
		4,                       // size of the first pickle frame's payload
		uint32(8 + len(padded)), // header frame size; contents begin at 8 + this value
		uint32(4 + len(padded)), // header frame payload size (validated as headerSize - 4)
		uint32(len(headerJSON)), // JSON string size, excluding padding
	} {
		require.NoError(t, binary.Write(&archive, binary.LittleEndian, v))
	}
	archive.Write(padded)
	archive.Write(contents.Bytes())
	require.NoError(t, os.WriteFile(asarPath, archive.Bytes(), 0o644))
}

// writeAsarFixture builds a minimal app.asar containing a package.json with the given version.
func writeAsarFixture(t *testing.T, asarPath string, version string) {
	t.Helper()
	writeAsarWithFiles(t, asarPath, map[string]string{
		"package.json": fmt.Sprintf(`{"version":%q}`, version),
	})
}

func TestGameVersionCacheEntryMatches(t *testing.T) {
	base := time.Unix(1_700_000_000, 0)
	entry := gameVersionCacheEntry{
		asarPath: "/game/resources/app.asar",
		mTime:    base,
		size:     1024,
		version:  "1.4.10",
		valid:    true,
	}

	cases := []struct {
		name    string
		path    string
		size    int64
		modTime time.Time
		want    bool
	}{
		{"identical", entry.asarPath, entry.size, base, true},
		{"different mod time (game updated)", entry.asarPath, entry.size, base.Add(time.Second), false},
		{"different size", entry.asarPath, entry.size + 1, base, false},
		{"different path (exe moved)", "/other/resources/app.asar", entry.size, base, false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := entry.matches(tc.path, tc.size, tc.modTime); got != tc.want {
				t.Fatalf("matches(%q, %d, %v) = %v, want %v", tc.path, tc.size, tc.modTime, got, tc.want)
			}
		})
	}
}

func TestGameVersionCacheEntryInvalidNeverMatches(t *testing.T) {
	var zero gameVersionCacheEntry // valid == false
	if zero.matches("/game/resources/app.asar", 1024, time.Unix(1_700_000_000, 0)) {
		t.Fatal("unset cache entry must never report a match")
	}
}

func TestFindAsarResolvesBundleAndInnerBinary(t *testing.T) {
	root := t.TempDir()
	bundle := filepath.Join(root, "Subway Builder.app")
	asarPath := filepath.Join(bundle, "Contents", "Resources", "app.asar")
	require.NoError(t, os.MkdirAll(filepath.Dir(asarPath), 0o755))
	require.NoError(t, os.WriteFile(asarPath, []byte("x"), 0o644))
	inner := filepath.Join(bundle, "Contents", "MacOS", "Subway Builder")
	require.NoError(t, os.MkdirAll(filepath.Dir(inner), 0o755))
	require.NoError(t, os.WriteFile(inner, []byte("bin"), 0o755))

	found, path := findAsar(bundle)
	require.True(t, found)
	require.Equal(t, asarPath, path)

	// The inner binary walks up to the containing bundle.
	found, path = findAsar(inner)
	require.True(t, found)
	require.Equal(t, asarPath, path)

	found, _ = findAsar(t.TempDir())
	require.False(t, found)
}

func resolveConfigFor(cfg types.AppConfig) types.ResolveConfigResponse {
	_, validation := cfg.ValidateConfigPaths()
	return types.ResolveConfigResponse{
		ResolveConfigResult: types.ResolveConfigResult{Config: cfg, Validation: validation},
	}
}

func TestResolveGameAsarPathSteam(t *testing.T) {
	app := newTestApp()
	cfg := resolveConfigFor(types.AppConfig{UseSteamLaunch: true, SteamGamePath: "/sg"})

	// Same result on every goos: the Steam path shape is resolved by SteamGameAsarPath.
	for _, goos := range []string{"darwin", "linux", "windows"} {
		path, ok := app.resolveGameAsarPath(goos, cfg)
		require.True(t, ok)
		require.Equal(t, constants.SteamGameAsarPath("/sg"), path)
	}
}

func TestResolveGameAsarPathDarwinNative(t *testing.T) {
	app := newTestApp()
	root := t.TempDir()
	bundle := filepath.Join(root, "Subway Builder.app")
	asarPath := filepath.Join(bundle, "Contents", "Resources", "app.asar")
	require.NoError(t, os.MkdirAll(filepath.Dir(asarPath), 0o755))
	require.NoError(t, os.WriteFile(asarPath, []byte("x"), 0o644))

	path, ok := app.resolveGameAsarPath("darwin", resolveConfigFor(types.AppConfig{ExecutablePath: bundle}))
	require.True(t, ok)
	require.Equal(t, asarPath, path)

	// No asar anywhere above the executable: not resolvable.
	_, ok = app.resolveGameAsarPath("darwin", resolveConfigFor(types.AppConfig{ExecutablePath: t.TempDir()}))
	require.False(t, ok)
}

func TestResolveGameAsarPathDefaultUsesExecutableDir(t *testing.T) {
	app := newTestApp()
	exePath := filepath.Join("/games", "subway", "game.exe")
	expected := filepath.Join("/games", "subway", "resources", "app.asar")

	for _, goos := range []string{"windows", "linux"} {
		path, ok := app.resolveGameAsarPath(goos, resolveConfigFor(types.AppConfig{ExecutablePath: exePath}))
		require.True(t, ok)
		require.Equal(t, expected, path)
	}
}

func TestDecodeGameVersionFromAsar(t *testing.T) {
	asarPath := filepath.Join(t.TempDir(), "app.asar")
	writeAsarFixture(t, asarPath, "1.4.11")

	version, err := decodeGameVersionFromAsar(asarPath)
	require.NoError(t, err)
	require.Equal(t, "1.4.11", version)

	// Missing file.
	_, err = decodeGameVersionFromAsar(filepath.Join(t.TempDir(), "missing.asar"))
	require.Error(t, err)

	// Not an asar archive.
	garbagePath := filepath.Join(t.TempDir(), "garbage.asar")
	require.NoError(t, os.WriteFile(garbagePath, []byte("not an archive"), 0o644))
	_, err = decodeGameVersionFromAsar(garbagePath)
	require.Error(t, err)

	// Valid archive without package.json.
	noPkgPath := filepath.Join(t.TempDir(), "nopkg.asar")
	writeAsarWithFiles(t, noPkgPath, map[string]string{"other.json": "{}"})
	_, err = decodeGameVersionFromAsar(noPkgPath)
	require.Error(t, err)
}

// newSteamGameVersionApp wires an App whose game source is a Steam install fixture, which
// resolves identically on every host OS.
func newSteamGameVersionApp(t *testing.T, gamePath string) *App {
	t.Helper()
	app := newTestApp()
	app.Config = config.NewConfig(app.Logger)
	app.Config.Cfg = types.AppConfig{UseSteamLaunch: true, SteamGamePath: gamePath}
	return app
}

func TestGetGameVersionDetectsCachesAndInvalidates(t *testing.T) {
	gamePath := t.TempDir()
	asarPath := constants.SteamGameAsarPath(gamePath)
	writeAsarFixture(t, asarPath, "9.9.9")
	app := newSteamGameVersionApp(t, gamePath)

	first := app.GetGameVersion()
	require.Equal(t, types.ResponseSuccess, first.Status)
	require.Equal(t, "9.9.9", first.Version)

	// Corrupt the archive while preserving size and mod time: a cache hit is the only way the
	// version can still resolve.
	info, err := os.Stat(asarPath)
	require.NoError(t, err)
	require.NoError(t, os.WriteFile(asarPath, bytes.Repeat([]byte("x"), int(info.Size())), 0o644))
	require.NoError(t, os.Chtimes(asarPath, info.ModTime(), info.ModTime()))

	second := app.GetGameVersion()
	require.Equal(t, types.ResponseSuccess, second.Status)
	require.Equal(t, "9.9.9", second.Version)

	// Bumping the mod time invalidates the cache; the corrupted archive then fails to decode.
	require.NoError(t, os.Chtimes(asarPath, info.ModTime().Add(time.Second), info.ModTime().Add(time.Second)))
	third := app.GetGameVersion()
	require.Equal(t, types.ResponseWarn, third.Status)
	require.Equal(t, "", third.Version)
}

func TestGetGameVersionNotDetectedWithoutValidGameSource(t *testing.T) {
	app := newTestApp()
	app.Config = config.NewConfig(app.Logger)

	result := app.GetGameVersion()
	require.Equal(t, types.ResponseWarn, result.Status)
	require.Equal(t, "", result.Version)

	if runtime.GOOS != "windows" {
		// A configured but vanished Steam install is likewise not detected.
		app.Config.Cfg = types.AppConfig{UseSteamLaunch: true, SteamGamePath: "/does/not/exist"}
		result = app.GetGameVersion()
		require.Equal(t, types.ResponseWarn, result.Status)
	}
}
