package main

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// galleryAssetPrefix is the URL path prefix the gallery image server serves under. The
// frontend points <img> sources at http://127.0.0.1:<port>/gallery/.
// The webview loads images through a native pipeline instead of receiving
// base64 data URIs over the IPC bridge.
const galleryAssetPrefix = "/gallery/"

// servableImageExts is the allowlist of extensions the gallery handler serves, so it can
// never be used to read arbitrary non-image files from the registry repo.
var servableImageExts = map[string]bool{
	".png":  true,
	".jpg":  true,
	".jpeg": true,
	".gif":  true,
	".webp": true,
	".avif": true,
}

// galleryAssetHandler serves registry gallery images under galleryAssetPrefix from the local
// registry repo.
func galleryAssetHandler(repoPath string) http.Handler {
	absRepo, err := filepath.Abs(repoPath)
	if err != nil {
		absRepo = repoPath
	}

	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")

		if !strings.HasPrefix(req.URL.Path, galleryAssetPrefix) {
			http.NotFound(w, req)
			return
		}

		rel := strings.TrimPrefix(req.URL.Path, galleryAssetPrefix)
		// Clean collapse any ".." segments; reject anything that still escapes or is absolute.
		cleaned := filepath.Clean(filepath.FromSlash(rel))
		if cleaned == "." || cleaned == ".." || strings.HasPrefix(cleaned, ".."+string(os.PathSeparator)) || filepath.IsAbs(cleaned) {
			http.NotFound(w, req)
			return
		}

		if !servableImageExts[strings.ToLower(filepath.Ext(cleaned))] {
			http.NotFound(w, req)
			return
		}

		full := filepath.Join(absRepo, cleaned)
		// Ensure the resolved path stays within the repo root.
		if full != absRepo && !strings.HasPrefix(full, absRepo+string(os.PathSeparator)) {
			http.NotFound(w, req)
			return
		}

		http.ServeFile(w, req, full)
	})
}
