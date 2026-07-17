package main

// Game version detection: resolving the installed game's app.asar per platform and launch
// type, decoding its package.json version, and caching the result keyed by the asar's stat.

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"railyard/internal/constants"
	"railyard/internal/types"

	"github.com/beescuit/asar"
)

// gameVersionCacheEntry is the memoized result of a successful app.asar decode. It is reused
// while the asar's path, size, and mod time are unchanged.
type gameVersionCacheEntry struct {
	asarPath string
	mTime    time.Time
	size     int64
	version  string
	valid    bool
}

// matches reports whether a cached entry is still valid for the asar currently on disk.
func (e gameVersionCacheEntry) matches(asarPath string, size int64, mTime time.Time) bool {
	return e.valid && e.asarPath == asarPath && e.size == size && e.mTime.Equal(mTime)
}

// findAsar walks up from exePath until it finds a directory that contains
// Contents/Resources/app.asar, returning the full asar path. This handles both
// the case where executablePath is the .app bundle and where it is the binary inside it.
func findAsar(exePath string) (bool, string) {
	dir := exePath
	if info, err := os.Stat(exePath); err == nil && !info.IsDir() {
		dir = filepath.Dir(exePath)
	}
	for {
		candidate := filepath.Join(dir, constants.GameAsarMacRelPath)
		if _, err := os.Stat(candidate); err == nil {
			return true, candidate
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return false, ""
		}
		dir = parent
	}
}

// resolveGameAsarPath resolves the app.asar location for the configured launch source. On
// Linux it may mount the game AppImage as a side effect. Returns false when no asar can be
// located for the configuration.
func (a *App) resolveGameAsarPath(goos string, cfg types.ResolveConfigResponse) (string, bool) {
	if cfg.Config.UseSteamLaunch {
		// SteamGamePath is resolved and validated when Steam launch is configured, so no
		// per-call library autodetection is needed here.
		return constants.SteamGameAsarPath(cfg.Config.SteamGamePath), true
	}

	exePath := cfg.Config.ExecutablePath
	switch {
	case goos == "darwin":
		// executablePath may point to the .app bundle or a binary nested inside it.
		found, foundPath := findAsar(exePath)
		if !found {
			a.Logger.Warn("Failed to locate app.asar for game version detection", "exePath", exePath)
			return "", false
		}
		return foundPath, true
	case isAppImagePath(exePath):
		if a.appImageMount == nil {
			a.Logger.Info("Mounting AppImage for game version detection", "exePath", exePath)
			appImageMount, err := newAppImageMount(exePath)
			if err != nil {
				a.Logger.Error("Failed to mount AppImage for game version detection", err, "exePath", exePath)
				return "", false
			}
			a.appImageMount = appImageMount
		} else {
			a.Logger.Info("Using existing AppImage mount for game version detection", "exePath", exePath, "mountPath", a.appImageMount.AppImageMountPath)
		}
		return filepath.Join(a.appImageMount.AppImageMountPath, constants.GameAsarRelPath), true
	default:
		return filepath.Join(filepath.Dir(exePath), constants.GameAsarRelPath), true
	}
}

// decodeGameVersionFromAsar reads the version field of the package.json inside the archive.
func decodeGameVersionFromAsar(asarPath string) (string, error) {
	archiveFile, err := os.Open(asarPath)
	if err != nil {
		return "", fmt.Errorf("failed to open app.asar: %w", err)
	}
	defer archiveFile.Close()

	archive, err := asar.Decode(archiveFile)
	if err != nil {
		return "", fmt.Errorf("failed to decode app.asar: %w", err)
	}

	packageFile := archive.Find("package.json")
	if packageFile == nil {
		return "", errors.New("package.json not found in app.asar")
	}

	var pkg struct {
		Version string `json:"version"`
	}
	if err := json.NewDecoder(packageFile.Open()).Decode(&pkg); err != nil {
		return "", fmt.Errorf("failed to decode package.json: %w", err)
	}
	return pkg.Version, nil
}

// GetGameVersion detects the installed Subway Builder version from app.asar's
// package.json, returning an empty version with a warning status if detection fails.
// The result is cached keyed by the asar's path + size + mod time: decoding the whole archive
// costs hundreds of ms and this is called frequently (frontend + every subscription pass), so
// repeat calls only stat the file. A game update mid-session changes the mod time and re-decodes,
// keeping compatibility checks and mod-loaded artifacts (e.g. buildings index) current.
func (a *App) GetGameVersion() types.GameVersionResponse {
	// Timed (with cached=true|false) because the decode path is a known hot spot; the log lets us
	// confirm repeat calls hit the cache instead of re-decoding.
	start := time.Now()
	cached := false
	defer func() {
		a.Logger.Perf("backend", "gameVersion.resolve", "duration", time.Since(start), "cached", cached)
	}()
	a.Logger.Info("Attempting to resolve game version")
	notDetected := types.GameVersionResponse{
		GenericResponse: types.WarnResponse("Game version not detected"),
		Version:         "",
	}

	cfg := a.Config.GetConfig()
	if !cfg.Validation.GameSourceValid {
		return notDetected
	}

	asarPath, ok := a.resolveGameAsarPath(runtime.GOOS, cfg)
	if !ok {
		return notDetected
	}

	info, statErr := os.Stat(asarPath)
	if statErr == nil {
		a.gameVersionMu.Lock()
		entry := a.gameVersionCache
		a.gameVersionMu.Unlock()
		if entry.matches(asarPath, info.Size(), info.ModTime()) {
			cached = true
			return types.GameVersionResponse{
				GenericResponse: types.SuccessResponse("Game version detected"),
				Version:         entry.version,
			}
		}
	}

	// Stat failure just falls through to the decode path (which reports the real error).
	version, err := decodeGameVersionFromAsar(asarPath)
	if err != nil {
		a.Logger.Warn("Failed to read game version from app.asar", "error", err, "asarPath", asarPath)
		return notDetected
	}

	// Cache the successful decode so later calls stat-and-return until the asar changes.
	if statErr == nil {
		a.gameVersionMu.Lock()
		a.gameVersionCache = gameVersionCacheEntry{
			asarPath: asarPath,
			mTime:    info.ModTime(),
			size:     info.Size(),
			version:  version,
			valid:    true,
		}
		a.gameVersionMu.Unlock()
	}

	a.Logger.Info("Game version detected", "version", version)
	return types.GameVersionResponse{
		GenericResponse: types.SuccessResponse("Game version detected"),
		Version:         version,
	}
}
