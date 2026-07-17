package steam

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/stretchr/testify/require"
)

// TestGetSteamLibraryPathFindsDefaultLocation covers the per-OS probe hit path; the
// directory-dialog fallback requires a live Wails context and is intentionally untested.
func TestGetSteamLibraryPathFindsDefaultLocation(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("windows resolves the Steam path from the registry")
	}
	home := t.TempDir()
	t.Setenv("HOME", home)

	var steamapps string
	switch runtime.GOOS {
	case "darwin":
		steamapps = filepath.Join(home, "Library", "Application Support", "Steam", "steamapps")
	default:
		steamapps = filepath.Join(home, ".steam", "steam", "steamapps")
	}
	require.NoError(t, os.MkdirAll(steamapps, 0o755))

	found, err := GetSteamLibraryPath(context.Background())
	require.NoError(t, err)
	require.Equal(t, steamapps, found)
}
