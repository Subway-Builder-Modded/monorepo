package files

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestInstalledModSize(t *testing.T) {
	t.Run("returns managed directory size", func(t *testing.T) {
		root := t.TempDir()
		modID := "mod-a"
		modPath := filepath.Join(root, modID)
		require.NoError(t, os.MkdirAll(modPath, 0o755))
		require.NoError(t, os.WriteFile(filepath.Join(modPath, ".marker"), []byte("m"), 0o644))
		require.NoError(t, os.WriteFile(filepath.Join(modPath, "mod.bin"), []byte("12345"), 0o644))

		size, err := InstalledModSize(root, modID, ".marker")
		require.NoError(t, err)
		require.Equal(t, int64(6), size)
	})

	t.Run("returns zero for missing marker or files", func(t *testing.T) {
		root := t.TempDir()
		size, err := InstalledModSize(root, "missing", ".marker")
		require.NoError(t, err)
		require.Equal(t, int64(0), size)
	})
}

func TestInstalledMapSize(t *testing.T) {
	t.Run("returns managed directory size plus optional tiles size", func(t *testing.T) {
		mapRoot := t.TempDir()
		tileRoot := t.TempDir()
		cityCode := "AAA"

		mapPath := filepath.Join(mapRoot, cityCode)
		require.NoError(t, os.MkdirAll(mapPath, 0o755))
		require.NoError(t, os.WriteFile(filepath.Join(mapPath, ".marker"), []byte("m"), 0o644))
		require.NoError(t, os.WriteFile(filepath.Join(mapPath, "roads.geojson.gz"), []byte("12345"), 0o644))
		require.NoError(t, os.WriteFile(filepath.Join(tileRoot, cityCode+MapTileFileExt), []byte("123"), 0o644))

		size, err := InstalledMapSize(mapRoot, tileRoot, cityCode, ".marker")
		require.NoError(t, err)
		require.Equal(t, int64(9), size)
	})

	t.Run("returns zero when unmanaged or missing", func(t *testing.T) {
		size, err := InstalledMapSize(t.TempDir(), t.TempDir(), "ZZZ", ".marker")
		require.NoError(t, err)
		require.Equal(t, int64(0), size)
	})
}
