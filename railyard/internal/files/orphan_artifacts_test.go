package files

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestCleanupOrphanFoundationTiles(t *testing.T) {
	t.Run("missing tiles directory is a no-op", func(t *testing.T) {
		removed, err := CleanupOrphanFoundationTiles(filepath.Join(t.TempDir(), "does-not-exist"))
		require.NoError(t, err)
		require.Empty(t, removed)
	})

	t.Run("removes foundations whose base tile is gone, keeps everything else", func(t *testing.T) {
		tilesRoot := t.TempDir()
		write := func(name string) string {
			path := filepath.Join(tilesRoot, name)
			require.NoError(t, os.WriteFile(path, []byte("x"), 0o644))
			return path
		}

		pairedBase := write("AAA" + MapTileFileExt)
		pairedFoundations := write("AAA" + MapFoundationTileFileExt)
		orphanFoundations := write("BBB" + MapFoundationTileFileExt)
		loneBase := write("CCC" + MapTileFileExt)
		codelessFoundations := write(MapFoundationTileFileExt)
		unrelated := write("notes.txt")
		require.NoError(t, os.MkdirAll(filepath.Join(tilesRoot, "subdir"), 0o755))

		removed, err := CleanupOrphanFoundationTiles(tilesRoot)
		require.NoError(t, err)
		require.Equal(t, []string{orphanFoundations}, removed)

		require.NoFileExists(t, orphanFoundations)
		require.FileExists(t, pairedBase)
		require.FileExists(t, pairedFoundations)
		require.FileExists(t, loneBase)
		require.FileExists(t, codelessFoundations)
		require.FileExists(t, unrelated)
		require.DirExists(t, filepath.Join(tilesRoot, "subdir"))
	})

	t.Run("idempotent on a clean directory", func(t *testing.T) {
		tilesRoot := t.TempDir()
		require.NoError(t, os.WriteFile(filepath.Join(tilesRoot, "AAA"+MapTileFileExt), []byte("x"), 0o644))

		removed, err := CleanupOrphanFoundationTiles(tilesRoot)
		require.NoError(t, err)
		require.Empty(t, removed)
	})
}
