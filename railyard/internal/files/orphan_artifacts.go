package files

import (
	"errors"
	"io/fs"
	"os"
	"strings"

	"railyard/internal/paths"
)

// CleanupOrphanFoundationTiles removes foundation tile files directly inside tilesRoot whose base .pmtiles file is gone (orphaned by pre-0.2.10 uninstalls), returning the removed paths.
func CleanupOrphanFoundationTiles(tilesRoot string) ([]string, error) {
	entries, err := os.ReadDir(tilesRoot)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return nil, nil
		}
		return nil, err
	}

	var removed []string
	var errs []error
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		code := strings.TrimSuffix(name, MapFoundationTileFileExt)
		if code == name || code == "" {
			continue
		}
		baseTileExists, statErr := FileExists(paths.JoinLocalPath(tilesRoot, code+MapTileFileExt))
		if statErr != nil {
			errs = append(errs, statErr)
			continue
		}
		if baseTileExists {
			// A paired foundations file may belong to a swapped-out profile; stale
			// pairs are reconciled by the install and profile-restore paths.
			// TODO(profiles): reclaim swapped-out assets in the full stale-asset purge.
			continue
		}
		orphanPath := paths.JoinLocalPath(tilesRoot, name)
		if removeErr := os.Remove(orphanPath); removeErr != nil && !errors.Is(removeErr, fs.ErrNotExist) {
			errs = append(errs, removeErr)
			continue
		}
		removed = append(removed, orphanPath)
	}
	return removed, errors.Join(errs...)
}
