package files

import (
	"errors"
	"io/fs"
	"os"
	"strings"

	"railyard/internal/paths"
)

// CleanupOrphanFoundationTiles scans the Railyard-managed tiles directory for
// foundation tile files (<code>_foundations.pmtiles) whose base tile
// (<code>.pmtiles) is gone — the signature of a map uninstalled before
// foundation tiles were included in uninstall cleanup (pre-0.2.10). Returns the
// paths removed. Only files directly inside tilesRoot are ever touched; the
// game's own data directories are never scanned.
//
// A foundations file whose base tile still exists is always kept: the pair may
// belong to a swapped-out profile, and stale-but-paired files are reconciled by
// the install and profile-restore paths instead.
// TODO(profiles): reclaiming whole swapped-out pairs belongs to the full
// stale-asset purge deferred in profiles_state.SwapProfile.
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
