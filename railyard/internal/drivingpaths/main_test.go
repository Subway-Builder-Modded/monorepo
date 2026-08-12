package drivingpaths

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"railyard/internal/logger"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func TestHandleResetCacheResetsCache(t *testing.T) {
	previousCache := drivingPathsCache
	drivingPathsCache = &types.DrivingPathsCache{}
	t.Cleanup(func() { drivingPathsCache = previousCache })

	drivingPathsCache.AddMap("KUN", types.DrivingPathsFile{"pop-1": json.RawMessage("[[1,2]]")})
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodDelete, "/cache", nil)

	handleResetCache(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)
	require.False(t, drivingPathsCache.HasMap("KUN"))
	require.Equal(t, "Driving paths cache reset", recorder.Body.String())
}

func TestHandleResetCacheRejectsNonDelete(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/cache", nil)

	handleResetCache(recorder, request)

	require.Equal(t, http.StatusMethodNotAllowed, recorder.Code)
}

func TestHandleLoadDrivingPathsForCityReturnsLoadedMessageWhenAlreadyCached(t *testing.T) {
	previousCache := drivingPathsCache
	drivingPathsCache = &types.DrivingPathsCache{}
	previousLogger := globalLogger
	globalLogger = logger.LoggerAtPath(filepath.Join(t.TempDir(), "drivingpaths.log"))
	t.Cleanup(func() {
		drivingPathsCache = previousCache
		globalLogger = previousLogger
	})

	drivingPathsCache.AddMap("KUN", types.DrivingPathsFile{"pop-1": json.RawMessage("[[1,2]]")})
	recorder := httptest.NewRecorder()
	body := strings.NewReader("cityCode=KUN")
	request := httptest.NewRequest(http.MethodPost, "/loadpaths", body)
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	handleLoadDrivingPathsForCity(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)
	require.Equal(t, "Driving paths already loaded for city: KUN", recorder.Body.String())
}

func TestHandleLoadDrivingPathsForCityRejectsMissingCityCode(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/loadpaths", nil)
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	handleLoadDrivingPathsForCity(recorder, request)

	require.Equal(t, http.StatusBadRequest, recorder.Code)
	require.Contains(t, recorder.Body.String(), "Missing cityCode parameter")
}

func TestHandleGetDrivingPathForCityReturnsJSON(t *testing.T) {
	previousCache := drivingPathsCache
	drivingPathsCache = &types.DrivingPathsCache{}
	previousLogger := globalLogger
	globalLogger = logger.LoggerAtPath(filepath.Join(t.TempDir(), "drivingpaths.log"))
	t.Cleanup(func() {
		drivingPathsCache = previousCache
		globalLogger = previousLogger
	})

	drivingPathsCache.AddMap("KUN", types.DrivingPathsFile{"pop-1": json.RawMessage("[[1.1,2.2],[3.3,4.4]]")})
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/path?cityCode=KUN&popId=pop-1", nil)

	handleGetDrivingPathForCity(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)
	require.Equal(t, "application/json", recorder.Header().Get("Content-Type"))
	require.JSONEq(t, `{"coordinates":[[1.1,2.2],[3.3,4.4]]}`, recorder.Body.String())
}

func TestHandleGetDrivingPathForCityReturnsNotFound(t *testing.T) {
	previousCache := drivingPathsCache
	drivingPathsCache = &types.DrivingPathsCache{}
	previousLogger := globalLogger
	globalLogger = logger.LoggerAtPath(filepath.Join(t.TempDir(), "drivingpaths.log"))
	t.Cleanup(func() {
		drivingPathsCache = previousCache
		globalLogger = previousLogger
	})

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/path?cityCode=KUN&popId=missing", nil)

	handleGetDrivingPathForCity(recorder, request)

	require.Equal(t, http.StatusNotFound, recorder.Code)
	require.Contains(t, recorder.Body.String(), "Driving path not found for cityCode: KUN and popId: missing")
}

func TestHandleGetDrivingPathForCityLazyLoadsWhenCacheEmpty(t *testing.T) {
	previousCache := drivingPathsCache
	drivingPathsCache = &types.DrivingPathsCache{}
	previousLogger := globalLogger
	globalLogger = logger.LoggerAtPath(filepath.Join(t.TempDir(), "drivingpaths.log"))
	previousDataPath := metroMakerDataPath
	metroMakerRoot := t.TempDir()
	metroMakerDataPath = metroMakerRoot
	t.Cleanup(func() {
		drivingPathsCache = previousCache
		globalLogger = previousLogger
		metroMakerDataPath = previousDataPath
	})

	cityDir := filepath.Join(metroMakerRoot, "cities", "data", "KUN")
	require.NoError(t, os.MkdirAll(cityDir, 0o755))
	require.NoError(t, os.WriteFile(filepath.Join(cityDir, "driving_paths.json"), []byte(`{"pop-1":[[1.1,2.2],[3.3,4.4]]}`), 0o644))

	// No prior POST /loadpaths — the cache starts empty, mirroring an early request.
	require.False(t, drivingPathsCache.HasMap("KUN"))

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/path?cityCode=KUN&popId=pop-1", nil)
	handleGetDrivingPathForCity(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)
	require.JSONEq(t, `{"coordinates":[[1.1,2.2],[3.3,4.4]]}`, recorder.Body.String())
	require.True(t, drivingPathsCache.HasMap("KUN"))
}
