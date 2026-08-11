package drivingpaths

import (
	"compress/gzip"
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"railyard/internal/types"
)

func TestLoadDrivingPathsForCityLoadsJSONFileIntoCache(t *testing.T) {
	cache := &types.DrivingPathsCache{}
	metroMakerRoot := t.TempDir()
	cityDir := filepath.Join(metroMakerRoot, "cities", "data", "KUN")
	require.NoError(t, os.MkdirAll(cityDir, 0o755))

	data := []byte(`{"pop-1":[[1.1,2.2],[3.3,4.4]]}`)
	require.NoError(t, os.WriteFile(filepath.Join(cityDir, "driving_paths.json"), data, 0o644))

	err := loadDrivingPathsForCity("KUN", cache, metroMakerRoot)
	require.NoError(t, err)

	path, ok := cache.GetPath("KUN", "pop-1")
	require.True(t, ok)
	require.JSONEq(t, "[[1.1,2.2],[3.3,4.4]]", string(path))
	require.True(t, cache.HasMap("KUN"))
}

func TestLoadDrivingPathsForCityLoadsGzipFileIntoCache(t *testing.T) {
	cache := &types.DrivingPathsCache{}
	metroMakerRoot := t.TempDir()
	cityDir := filepath.Join(metroMakerRoot, "cities", "data", "KUN")
	require.NoError(t, os.MkdirAll(cityDir, 0o755))

	data := []byte(`{"pop-2":[[5.5,6.6]]}`)
	path := filepath.Join(cityDir, "driving_paths.json.gz")
	file, err := os.Create(path)
	require.NoError(t, err)
	gz := gzip.NewWriter(file)
	_, err = gz.Write(data)
	require.NoError(t, err)
	require.NoError(t, gz.Close())
	require.NoError(t, file.Close())

	err = loadDrivingPathsForCity("KUN", cache, metroMakerRoot)
	require.NoError(t, err)

	pathData, ok := cache.GetPath("KUN", "pop-2")
	require.True(t, ok)
	require.JSONEq(t, "[[5.5,6.6]]", string(pathData))
}

func TestLoadIfAbsentSerializesConcurrentLoads(t *testing.T) {
	cache := &types.DrivingPathsCache{}
	var loaderCalls atomic.Int32
	started := make(chan struct{}, 1)
	release := make(chan struct{})

	loader := func() (types.DrivingPathsFile, error) {
		loaderCalls.Add(1)
		select {
		case started <- struct{}{}:
		default:
		}
		<-release
		return types.DrivingPathsFile{"pop-1": json.RawMessage("[[1,2]]")}, nil
	}

	var wg sync.WaitGroup
	errs := make(chan error, 3)
	for i := 0; i < 3; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			errs <- cache.LoadIfAbsent("KUN", loader)
		}()
	}

	require.Eventually(t, func() bool {
		return loaderCalls.Load() == 1
	}, time.Second, 10*time.Millisecond)

	close(release)
	wg.Wait()
	close(errs)

	for err := range errs {
		require.NoError(t, err)
	}

	require.Equal(t, int32(1), loaderCalls.Load())
	path, ok := cache.GetPath("KUN", "pop-1")
	require.True(t, ok)
	require.JSONEq(t, "[[1,2]]", string(path))
}
