package files

import (
	"errors"
	"io/fs"
	"os"
	"railyard/internal/paths"
	"strings"
)

// InstalledModSize returns the managed on-disk size for a mod installation, including all files and subdirectories under the mod's root directory.
func InstalledModSize(modsRoot string, modID string, markerFileName string) (int64, error) {
	if strings.TrimSpace(modsRoot) == "" || strings.TrimSpace(modID) == "" {
		return 0, nil
	}

	modPath := paths.JoinLocalPath(modsRoot, modID)
	return ManagedDirectorySize(modPath, markerFileName)
}

// InstalledMapSize returns the managed on-disk size for a map installation, including the .pmtiles object which lies in a separate directory under the Appdata folder.
func InstalledMapSize(mapsRoot string, tilesRoot string, cityCode string, markerFileName string) (int64, error) {
	if strings.TrimSpace(mapsRoot) == "" || strings.TrimSpace(cityCode) == "" {
		return 0, nil
	}

	mapPath := paths.JoinLocalPath(mapsRoot, cityCode)
	size, err := ManagedDirectorySize(mapPath, markerFileName)
	if err != nil {
		return 0, err
	}

	tilePath := paths.JoinLocalPath(tilesRoot, cityCode+MapTileFileExt)
	tileSize, err := FileSizeIfExists(tilePath)
	if err != nil {
		return 0, err
	}

	return size + tileSize, nil
}

// FileSizeIfExists returns the size of the target file when it exists.
// Missing files are treated as zero-size and non-fatal to the method.
func FileSizeIfExists(filePath string) (int64, error) {
	if strings.TrimSpace(filePath) == "" {
		return 0, nil
	}

	info, err := os.Stat(filePath)
	if err == nil {
		return info.Size(), nil
	}
	if errors.Is(err, fs.ErrNotExist) {
		return 0, nil
	}
	return 0, err
}
