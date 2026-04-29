package registry

import (
	"context"
	"encoding/base64"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"railyard/internal/config"
	"railyard/internal/paths"
	"railyard/internal/requests"
	"railyard/internal/types"
)

const RegistryRepoURL = "https://github.com/Subway-Builder-Modded/registry"

type logSink interface {
	Info(msg string, attrs ...any)
	Warn(msg string, attrs ...any)
	Error(msg string, err error, attrs ...any)
}

// Registry manages the local clone of the Subway Builder Modded registry repository.
type Registry struct {
	repoPath       string
	httpClient     *http.Client
	logger         logSink
	config         *config.Config
	mods           []types.ModManifest
	maps           []types.MapManifest
	downloadCounts map[types.AssetType]map[string]map[string]int
	versionsCache  map[string][]types.VersionInfo
	versionsMu     sync.RWMutex
	installedMods  []types.InstalledModInfo
	installedMaps  []types.InstalledMapInfo
	integrityMaps  types.RegistryIntegrityReport
	integrityMods  types.RegistryIntegrityReport
	context        context.Context

	// OnProgress is invoked while a Refresh() operation is in flight to
	// stream clone/fetch progress to the frontend. Set by app.startup().
	OnProgress func(RegistryProgress)

	refreshMu       sync.Mutex
	progressEnabled bool

	// gitHubAPIBaseURL overrides types.GitHubAPIBaseURL when non-empty. Reserved for tests that redirect HTTP traffic to a localhost server; production leaves this empty so all callers fall through to the const.
	gitHubAPIBaseURL string
}

// githubAPIBase returns the GitHub API base URL. Tests may set gitHubAPIBaseURL on the Registry to override the production default.
func (r *Registry) githubAPIBase() string {
	if r.gitHubAPIBaseURL != "" {
		return r.gitHubAPIBaseURL
	}
	return types.GitHubAPIBaseURL
}

// NewRegistry creates a new Registry instance with the platform-appropriate
// storage path.
func NewRegistry(l logSink, cfg *config.Config) *Registry {
	return &Registry{
		repoPath:   paths.RegistryRepoPath(),
		httpClient: requests.NewAPIClient(),
		logger:     l,
		config:     cfg,
		downloadCounts: map[types.AssetType]map[string]map[string]int{
			types.AssetTypeMap: {},
			types.AssetTypeMod: {},
		},
		versionsCache: map[string][]types.VersionInfo{},
	}
}

func (r *Registry) SetContext(ctx context.Context) {
	r.context = ctx
}

// Initialize ensures a valid local registry repo exists.
// It does not force a remote refresh.
func (r *Registry) Initialize() error {
	r.clearVersionsCache()
	if err := r.openOrClone(); err != nil {
		return err
	}

	if err := r.fetchFromDisk(); err != nil {
		return fmt.Errorf("failed to load registry data from disk: %w", err)
	}

	return nil
}

// Refresh forces a pull of the latest registry changes.
func (r *Registry) Refresh() error {
	r.refreshMu.Lock()
	defer r.refreshMu.Unlock()

	r.progressEnabled = true
	defer func() { r.progressEnabled = false }()

	r.emitProgress(RegistryProgress{
		Stage:   progressStageStarting,
		Phase:   progressPhaseFetch,
		Percent: -1,
	})

	r.clearVersionsCache() // Clear versions cache on refresh to ensure we fetch fresh version

	// Fast exit path: Skip the full fetch when the local repo already matches latest commit SHA. 
	// Failures here intentionally fall through to the normal, slow path
	if upToDate, err := r.isUpToDateWithRemote(); err != nil {
		r.logger.Info("Registry precheck failed; falling back to full fetch", "error", err)
	} else if upToDate {
		r.logger.Info("Registry precheck matched local HEAD; skipping fetch")
		r.emitProgress(RegistryProgress{Stage: progressStageComplete, Percent: 100})
		return nil
	}

	if err := r.refreshRepo(); err != nil {
		r.emitProgress(RegistryProgress{Stage: progressStageError, Error: err.Error()})
		return err
	}

	if err := r.fetchFromDisk(); err != nil {
		wrapped := fmt.Errorf("failed to load registry data from disk after refresh: %w", err)
		r.emitProgress(RegistryProgress{Stage: progressStageError, Error: wrapped.Error()})
		return wrapped
	}
	r.emitProgress(RegistryProgress{Stage: progressStageComplete, Percent: 100})
	return nil
}

// emitProgress forwards a progress payload to OnProgress when set and called from inside Refresh(). 
// Boot-time Initialize() does not enable progress, keeping that phase silent.
func (r *Registry) emitProgress(p RegistryProgress) {
	// Disk logging via logProgress runs unconditionally so a broken downstream doesn't leave us without an auditable debug log.
	r.logProgress(p)
	if !r.progressEnabled || r.OnProgress == nil {
		return
	}
	r.OnProgress(p)
}

// logProgress writes a disk-log entry for terminal stage events: stage starts (starting/checkout), terminal outcomes (complete/error), and the 100% tick of network stages (counting/compressing/receiving/resolving). Throttled mid-stage ticks are dropped so the log isn't flooded by the high-frequency "Receiving objects" updates.
func (r *Registry) logProgress(p RegistryProgress) {
	switch p.Stage {
	case progressStageError:
		r.logger.Warn("Registry refresh stage failed", "phase", p.Phase, "stage", p.Stage, "error", p.Error)
	case progressStageStarting, progressStageCheckout, progressStageDownloading, progressStageComplete:
		r.logger.Info("Registry refresh stage", "phase", p.Phase, "stage", p.Stage)
	default:
		if p.Percent >= 100 {
			attrs := []any{"phase", p.Phase, "stage", p.Stage, "current", p.Current, "total", p.Total}
			// Transferred is git's human-readable size string ("1.2 MiB"); only Receiving lines populate it. 
			// This is surfaced in the log so we can confirm steady-state shallow fetches stay small.
			if p.Transferred != "" {
				attrs = append(attrs, "transferred", p.Transferred)
			}
			r.logger.Info("Registry refresh stage complete", attrs...)
		}
	}
}

// RefreshResponse refreshes the registry and reports status metadata.
func (r *Registry) RefreshResponse() types.GenericResponse {
	if err := r.Refresh(); err != nil {
		return types.ErrorResponse(err.Error())
	}
	return types.SuccessResponse("Registry refreshed")
}

// GetMods returns all mod manifests.
func (r *Registry) GetMods() []types.ModManifest {
	NewMods := make([]types.ModManifest, 0)
	for _, mod := range r.mods {
		if mod.IsTest && !r.config.Cfg.ViewTestAssets {
			continue // Skip test mods if the setting is disabled
		}
		NewMods = append(NewMods, mod)
	}
	return NewMods
}

// GetModsResponse returns all mod manifests with status metadata.
func (r *Registry) GetModsResponse() types.ModsResponse {
	return types.ModsResponse{
		GenericResponse: types.SuccessResponse("Mods loaded"),
		Mods:            r.GetMods(),
	}
}

// GetMaps returns all map manifests.
func (r *Registry) GetMaps() []types.MapManifest {
	NewMaps := make([]types.MapManifest, 0)
	for _, m := range r.maps {
		if m.IsTest && !r.config.Cfg.ViewTestAssets {
			continue
		}
		NewMaps = append(NewMaps, m)
	}
	return NewMaps
}

// GetMapsResponse returns all map manifests with status metadata.
func (r *Registry) GetMapsResponse() types.MapsResponse {
	return types.MapsResponse{
		GenericResponse: types.SuccessResponse("Maps loaded"),
		Maps:            r.GetMaps(),
	}
}

func (r *Registry) GetIntegrityReport(assetType types.AssetType) (types.RegistryIntegrityReport, error) {
	switch assetType {
	case types.AssetTypeMod:
		return r.integrityMods, nil
	case types.AssetTypeMap:
		return r.integrityMaps, nil
	default:
		return types.RegistryIntegrityReport{}, fmt.Errorf("invalid asset type: %s", assetType)
	}
}

// GetIntegrityReportResponse returns the integrity report with status metadata.
func (r *Registry) GetIntegrityReportResponse(assetType types.AssetType) types.RegistryIntegrityReportResponse {
	report, err := r.GetIntegrityReport(assetType)
	if err != nil {
		return types.RegistryIntegrityReportResponse{
			GenericResponse: types.ErrorResponse(err.Error()),
			Report:          types.RegistryIntegrityReport{},
		}
	}

	return types.RegistryIntegrityReportResponse{
		GenericResponse: types.SuccessResponse("Integrity report loaded"),
		Report:          report,
	}
}

// GetMod looks up a mod manifest by ID from the loaded registry data.
func (r *Registry) GetMod(modID string) (*types.ModManifest, error) {
	for _, m := range r.GetMods() {
		if m.ID == modID {
			return &m, nil
		}
	}

	return nil, fmt.Errorf("mod with ID %q not found in registry", modID)
}

// GetMap looks up a map manifest by ID from the loaded registry data.
func (r *Registry) GetMap(mapID string) (*types.MapManifest, error) {
	for _, m := range r.GetMaps() {
		if m.ID == mapID {
			return &m, nil
		}
	}

	return nil, fmt.Errorf("map with ID %q not found in registry", mapID)
}

// GetGalleryImage reads an image file from the cloned registry repo and
// returns it as a base64 data URL suitable for use in an <img> src attribute.
func (r *Registry) GetGalleryImage(itemType string, itemID string, imagePath string) (string, error) {
	// Sanitize inputs to prevent path traversal
	if strings.Contains(itemType, "..") || strings.Contains(itemID, "..") || strings.Contains(imagePath, "..") {
		return "", fmt.Errorf("invalid path component: path traversal not allowed")
	}

	fullPath := filepath.Join(r.repoPath, itemType, itemID, imagePath)

	data, err := os.ReadFile(fullPath)
	if err != nil {
		return "", fmt.Errorf("failed to read gallery image %q: %w", fullPath, err)
	}

	// Detect MIME type from file extension
	mimeType := mimeFromExtension(filepath.Ext(fullPath))

	encoded := base64.StdEncoding.EncodeToString(data)
	return fmt.Sprintf("data:%s;base64,%s", mimeType, encoded), nil
}

// GetGalleryImageResponse reads a gallery image and returns it with status metadata.
func (r *Registry) GetGalleryImageResponse(itemType string, itemID string, imagePath string) types.GalleryImageResponse {
	url, err := r.GetGalleryImage(itemType, itemID, imagePath)
	if err != nil {
		return types.GalleryImageResponse{
			GenericResponse: types.ErrorResponse(err.Error()),
			ImageURL:        "",
		}
	}

	return types.GalleryImageResponse{
		GenericResponse: types.SuccessResponse("Gallery image loaded"),
		ImageURL:        url,
	}
}

// mimeFromExtension returns the MIME type for common image file extensions.
func mimeFromExtension(ext string) string {
	switch strings.ToLower(ext) {
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	case ".svg":
		return "image/svg+xml"
	case ".bmp":
		return "image/bmp"
	case ".ico":
		return "image/x-icon"
	default:
		return "application/octet-stream"
	}
}
