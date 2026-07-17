package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"railyard/internal/testutil"

	"github.com/stretchr/testify/require"
)

func TestThumbnailDirFor(t *testing.T) {
	require.Equal(t, "", thumbnailDirFor(""))
	require.Equal(t, filepath.ToSlash(filepath.Join("/data", "public", "data", "city-maps")), thumbnailDirFor("/data"))
}

func TestThumbnailHandlerServesFileWithCORS(t *testing.T) {
	dir := t.TempDir()
	require.NoError(t, os.WriteFile(filepath.Join(dir, "ukb.svg"), []byte("<svg/>"), 0o644))

	rec := httptest.NewRecorder()
	thumbnailHandler(dir)(rec, httptest.NewRequest(http.MethodGet, "/thumbnails/ukb.svg", nil))
	require.Equal(t, http.StatusOK, rec.Code)
	require.Equal(t, "*", rec.Header().Get("Access-Control-Allow-Origin"))
	require.Equal(t, "<svg/>", rec.Body.String())

	// Missing thumbnails 404; path traversal is neutralized by serving only the base name.
	rec = httptest.NewRecorder()
	thumbnailHandler(dir)(rec, httptest.NewRequest(http.MethodGet, "/thumbnails/missing.svg", nil))
	require.Equal(t, http.StatusNotFound, rec.Code)
}

func TestThumbnailDebugHandlerListsFiles(t *testing.T) {
	dir := t.TempDir()
	require.NoError(t, os.WriteFile(filepath.Join(dir, "ukb.svg"), []byte("x"), 0o644))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "kob.svg"), []byte("x"), 0o644))
	require.NoError(t, os.Mkdir(filepath.Join(dir, "subdir"), 0o755))

	rec := httptest.NewRecorder()
	thumbnailDebugHandler(dir, 1234)(rec, httptest.NewRequest(http.MethodGet, "/debug/thumbnails", nil))
	require.Equal(t, http.StatusOK, rec.Code)
	body := rec.Body.String()
	require.Contains(t, body, "ukb.svg")
	require.Contains(t, body, "kob.svg")
	require.Contains(t, body, "http://127.0.0.1:1234/thumbnails/ukb.svg")
	require.NotContains(t, body, "subdir")

	// An unreadable directory renders the error page rather than failing the request.
	rec = httptest.NewRecorder()
	thumbnailDebugHandler(filepath.Join(dir, "does-not-exist"), 1234)(rec, httptest.NewRequest(http.MethodGet, "/debug/thumbnails", nil))
	require.Equal(t, http.StatusOK, rec.Code)
	require.Contains(t, rec.Body.String(), "<h1>Error</h1>")
}

type fakeStatusServer struct {
	status int
	body   string
}

func (f fakeStatusServer) ServeHTTP(w http.ResponseWriter, _ *http.Request) int {
	_, _ = w.Write([]byte(f.body))
	return f.status
}

func TestPMTilesProxyHandlerDelegatesWithCORS(t *testing.T) {
	rec := httptest.NewRecorder()
	handler := pmtilesProxyHandler(fakeStatusServer{status: 200, body: "tile-bytes"}, testutil.TestLogSink{})
	handler(rec, httptest.NewRequest(http.MethodGet, "/tiles/0/0/0.mvt", nil))
	require.Equal(t, "*", rec.Header().Get("Access-Control-Allow-Origin"))
	require.Equal(t, "tile-bytes", rec.Body.String())
}
