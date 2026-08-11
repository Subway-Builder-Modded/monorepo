package drivingpaths

import (
	"bufio"
	"compress/gzip"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"

	"railyard/internal/paths"
	"railyard/internal/types"
)

func loadDrivingPathsForCity(cityCode string, cache *types.DrivingPathsCache, metroMakerDataPath string) error {
	// Loader function encapsulates the file read logic. It will be executed
	// at most once per cityCode by the cache's LoadIfAbsent method.
	loader := func() (types.DrivingPathsFile, error) {
		filePath := paths.JoinLocalPath(paths.MetroMakerMapsDataPath(metroMakerDataPath), cityCode, "driving_paths.json")
		filePathGzipped := filePath + ".gz"

		var raw []byte
		var err error
		if _, statErr := os.Stat(filePathGzipped); !errors.Is(statErr, fs.ErrNotExist) {
			raw, err = readGzippedFile(filePathGzipped)
		} else if _, statErr := os.Stat(filePath); errors.Is(statErr, fs.ErrNotExist) {
			return nil, errors.New("driving paths file not found for city: " + cityCode)
		} else {
			raw, err = os.ReadFile(filePath)
		}
		if err != nil {
			return nil, fmt.Errorf("failed to read driving paths for city %s: %w", cityCode, err)
		}

		parsed, err := parseDrivingPaths(raw)
		if err != nil {
			return nil, fmt.Errorf("failed to parse driving paths for city %s: %w", cityCode, err)
		}
		return parsed, nil
	}

	return cache.LoadIfAbsent(cityCode, loader)
}

// readGzippedFile reads and decompresses a gzip file, buffering the underlying
// file so the gzip reader isn't fed one small syscall at a time.
func readGzippedFile(path string) ([]byte, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	gz, err := gzip.NewReader(bufio.NewReaderSize(f, 1<<20))
	if err != nil {
		return nil, err
	}
	defer gz.Close()
	return io.ReadAll(gz)
}
