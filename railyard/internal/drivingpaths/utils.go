package drivingpaths

import (
	"errors"
	"fmt"
	"io/fs"
	"os"

	"railyard/internal/files"
	"railyard/internal/paths"
	"railyard/internal/types"
)

func loadDrivingPathsForCity(cityCode string, cache *types.DrivingPathsCache, metroMakerDataPath string) error {
	// Loader function encapsulates the file read logic. It will be executed
	// at most once per cityCode by the cache's LoadIfAbsent method.
	loader := func() (types.DrivingPathsFile, error) {
		filePath := paths.JoinLocalPath(paths.MetroMakerMapsDataPath(metroMakerDataPath), cityCode, "driving_paths.json")
		filePathGzipped := filePath + ".gz"
		usingGzip := false
		if _, err := os.Stat(filePathGzipped); !errors.Is(err, fs.ErrNotExist) {
			filePath = filePathGzipped
			usingGzip = true
		} else if _, err := os.Stat(filePath); errors.Is(err, fs.ErrNotExist) {
			return nil, errors.New("driving paths file not found for city: " + cityCode)
		}

		switch usingGzip {
		case true:
			p, err := files.ReadJSONFromGzip[types.DrivingPathsFile](filePath, "driving_paths")
			if err != nil {
				return nil, fmt.Errorf("failed to read driving paths for city %s: %w", cityCode, err)
			}
			return p, nil
		default:
			p, err := files.ReadJSON[types.DrivingPathsFile](filePath, "driving_paths", files.JSONReadOptions{})
			if err != nil {
				return nil, fmt.Errorf("failed to read driving paths for city %s: %w", cityCode, err)
			}
			return p, nil
		}
	}

	return cache.LoadIfAbsent(cityCode, loader)
}
