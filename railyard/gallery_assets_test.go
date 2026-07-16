package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func newGalleryTestRepo(t *testing.T) string {
	t.Helper()
	repo := t.TempDir()
	galleryDir := filepath.Join(repo, "maps", "test-map", "gallery")
	if err := os.MkdirAll(galleryDir, 0o755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(galleryDir, "shot.webp"), []byte("WEBPDATA"), 0o644); err != nil {
		t.Fatalf("write image: %v", err)
	}
	if err := os.WriteFile(filepath.Join(repo, "secret.txt"), []byte("SECRET"), 0o644); err != nil {
		t.Fatalf("write secret: %v", err)
	}
	return repo
}

func doGalleryRequest(t *testing.T, repo, target string) *httptest.ResponseRecorder {
	t.Helper()
	handler := galleryAssetHandler(repo)
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, target, nil)
	handler.ServeHTTP(rec, req)
	return rec
}

func TestGalleryHandlerServesImage(t *testing.T) {
	repo := newGalleryTestRepo(t)
	rec := doGalleryRequest(t, repo, "/gallery/maps/test-map/gallery/shot.webp")
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if rec.Body.String() != "WEBPDATA" {
		t.Fatalf("unexpected body %q", rec.Body.String())
	}
	if rec.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Errorf("expected CORS header")
	}
}

func TestGalleryHandlerRejectsTraversal(t *testing.T) {
	repo := newGalleryTestRepo(t)
	for _, target := range []string{
		"/gallery/../secret.txt",
		"/gallery/maps/../../secret.txt",
		"/gallery/maps/test-map/../../../secret.txt",
	} {
		rec := doGalleryRequest(t, repo, target)
		if rec.Code != http.StatusNotFound {
			t.Errorf("traversal %q: expected 404, got %d (body %q)", target, rec.Code, rec.Body.String())
		}
	}
}

func TestGalleryHandlerRejectsNonImage(t *testing.T) {
	repo := newGalleryTestRepo(t)
	rec := doGalleryRequest(t, repo, "/gallery/secret.txt")
	if rec.Code != http.StatusNotFound {
		t.Fatalf("non-image: expected 404, got %d", rec.Code)
	}
}

func TestGalleryHandlerRejectsNonGalleryPath(t *testing.T) {
	repo := newGalleryTestRepo(t)
	rec := doGalleryRequest(t, repo, "/something/else.png")
	if rec.Code != http.StatusNotFound {
		t.Fatalf("non-gallery path: expected 404, got %d", rec.Code)
	}
}

func TestGalleryHandlerMissingImage404(t *testing.T) {
	repo := newGalleryTestRepo(t)
	rec := doGalleryRequest(t, repo, "/gallery/maps/test-map/gallery/missing.webp")
	if rec.Code != http.StatusNotFound {
		t.Fatalf("missing image: expected 404, got %d", rec.Code)
	}
}
