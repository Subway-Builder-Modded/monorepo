package main

// This file defines the PMTiles sidecar server, which serves map tiles and generated
// thumbnails to the running game over loopback, plus generation of missing thumbnails
// for installed maps.

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"path"

	"railyard/internal/files"
	"railyard/internal/logger"
	"railyard/internal/paths"
	"railyard/internal/utils"

	"github.com/protomaps/go-pmtiles/pmtiles"
)

// thumbnailDirFor returns the map thumbnail directory under the MetroMaker data path, or ""
// when the data path is unset.
func thumbnailDirFor(metroMakerDataPath string) string {
	if metroMakerDataPath == "" {
		return ""
	}
	return path.Join(metroMakerDataPath, "public", "data", "city-maps")
}

// statusRecorder captures the status code written to a ResponseWriter for request logging.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

// thumbnailHandler serves generated map thumbnails from dir with permissive CORS,
// logging each request so missing/stale thumbnails are diagnosable from the app log.
func thumbnailHandler(dir string, log logger.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		filePath := path.Join(dir, path.Base(r.URL.Path))
		w.Header().Set("Access-Control-Allow-Origin", "*")
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		http.ServeFile(rec, r, filePath)
		log.Info("Handled thumbnail request", "path", r.URL.Path, "status", rec.status)
	}
}

// thumbnailDebugHandler renders an HTML index of the thumbnails in dir for debugging.
func thumbnailDebugHandler(dir string, port int) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		entries, err := os.ReadDir(dir)
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err != nil {
			fmt.Fprintf(w, "<html><body><h1>Error</h1><pre>%s</pre></body></html>", err.Error())
			return
		}
		fmt.Fprint(w, `<html><head><style>
			body { font-family: monospace; background: #1a1a2e; color: #e0e0e0; padding: 2rem; }
			h1 { color: #fff; }
			a { color: #7c9bff; display: block; margin: 0.5rem 0; }
			img { max-width: 200px; max-height: 200px; border: 1px solid #333; margin: 0.5rem; }
			.entry { display: inline-block; text-align: center; margin: 1rem; }
		</style></head><body>`)
		fmt.Fprintf(w, "<h1>Thumbnails (%d)</h1>", len(entries))
		for _, e := range entries {
			if e.IsDir() {
				continue
			}
			url := fmt.Sprintf("http://127.0.0.1:%d/thumbnails/%s", port, e.Name())
			fmt.Fprintf(w, `<div class="entry"><a href="%s"><img src="%s" /><br/>%s</a></div>`, url, url, e.Name())
		}
		fmt.Fprint(w, "</body></html>")
	}
}

// thumbnailIsFresh reports whether the SVG at svgPath exists and is at least as new as the
// map's tiles at tilesPath; an SVG older than its tiles is stale from a prior version.
// Missing tiles leave nothing newer to render from, so the existing SVG counts as fresh.
func thumbnailIsFresh(svgPath, tilesPath string) bool {
	svgInfo, err := os.Stat(svgPath)
	if err != nil {
		return false
	}
	tilesInfo, err := os.Stat(tilesPath)
	if err != nil {
		return true
	}
	return !svgInfo.ModTime().Before(tilesInfo.ModTime())
}

// statusServer is the tile-serving surface of pmtiles.Server, narrowed for testing.
type statusServer interface {
	ServeHTTP(http.ResponseWriter, *http.Request) int
}

// pmtilesProxyHandler serves tile requests with permissive CORS and per-request logging.
func pmtilesProxyHandler(server statusServer, log logger.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		statusCode := server.ServeHTTP(w, r)
		log.Info("Handled PMTiles request", "path", r.URL.Path, "status", statusCode)
	}
}

// startPMTilesServer starts the loopback tile/thumbnail server on an ephemeral port and
// returns the port once the server is ready to accept requests.
func (a *App) startPMTilesServer() (int, error) {
	listener, err := net.Listen("tcp", ":0")
	if err != nil {
		a.Logger.Warn("Failed to start PMTiles server listener", "error", err)
		return -1, err
	}
	port := listener.Addr().(*net.TCPAddr).Port

	a.Logger.Info(fmt.Sprintf("Starting PMTiles server on port %d", port))

	pmtilesServer, err := pmtiles.NewServerWithBucket(pmtiles.NewFileBucket(path.Join(paths.AppDataRoot(), "tiles")), "", log.New(a.Logger.Writer, "pmtiles: ", log.Default().Flags()), 128, "")
	if err != nil {
		listener.Close()
		a.Logger.Error("Failed to create PMTiles server", err)
		return -1, err
	}
	pmtilesServer.Start()

	thumbnailDir := thumbnailDirFor(a.Config.Cfg.MetroMakerDataPath)
	mux := http.NewServeMux()
	mux.Handle("/thumbnails/", thumbnailHandler(thumbnailDir, a.Logger))
	mux.Handle("/debug/thumbnails", thumbnailDebugHandler(thumbnailDir, port))
	mux.Handle("/", pmtilesProxyHandler(pmtilesServer, a.Logger))

	srv := &http.Server{Handler: mux}
	// Assigned before serving begins so StopGame always sees the server it needs to close.
	a.pmtilesServer = srv
	go func() {
		a.Logger.Error("PMTiles error: ", srv.Serve(listener))
	}()
	return port, nil
}

// generateMissingThumbnails renders and saves an SVG thumbnail for every installed map that
// lacks one, or whose thumbnail is older than its installed tiles.
func (a *App) generateMissingThumbnails(port int) {
	thumbnailDir := path.Join(a.Config.Cfg.MetroMakerDataPath, "public", "data", "city-maps")
	os.MkdirAll(thumbnailDir, os.ModePerm)

	for _, m := range a.Registry.GetInstalledMaps() {
		svgPath := path.Join(thumbnailDir, m.MapConfig.Code+".svg")
		tilesPath := path.Join(paths.TilesPath(), m.MapConfig.Code+files.MapTileFileExt)
		if thumbnailIsFresh(svgPath, tilesPath) {
			continue
		}
		if !utils.CanGenerateThumbnail(m.MapConfig) {
			continue
		}
		a.Logger.Info("Generating missing thumbnail", "map", m.MapConfig.Code)
		data, err := utils.GenerateThumbnail(m.MapConfig.Code, m.MapConfig, port)
		if err != nil {
			a.Logger.Warn("Failed to generate thumbnail", "map", m.MapConfig.Code, "error", err)
			continue
		}
		if err := os.WriteFile(svgPath, []byte(data), 0644); err != nil {
			a.Logger.Warn("Failed to save thumbnail", "map", m.MapConfig.Code, "error", err)
		}
	}
}
