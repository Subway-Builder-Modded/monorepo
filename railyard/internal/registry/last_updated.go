package registry

import (
	"fmt"
	"math"
	"time"

	"railyard/internal/types"
)

// annotateModsLastUpdated resolves last_updated for each mod from on-disk data
// and drops any mod for which no timestamp is available. See annotateLastUpdated.
func (r *Registry) annotateModsLastUpdated(mods []types.ModManifest) []types.ModManifest {
	return annotateLastUpdated(
		mods,
		types.AssetTypeMod,
		func(m types.ModManifest) string { return m.ID },
		func(m types.ModManifest) int64 { return m.LastUpdated },
		func(m types.ModManifest, ts int64) types.ModManifest { m.LastUpdated = ts; return m },
		r.resolveAssetLastUpdated,
		r.logger,
	)
}

// annotateMapsLastUpdated resolves last_updated for each map from on-disk data
// and drops any map for which no timestamp is available. See annotateLastUpdated.
func (r *Registry) annotateMapsLastUpdated(maps []types.MapManifest) []types.MapManifest {
	return annotateLastUpdated(
		maps,
		types.AssetTypeMap,
		func(m types.MapManifest) string { return m.ID },
		func(m types.MapManifest) int64 { return m.LastUpdated },
		func(m types.MapManifest, ts int64) types.MapManifest { m.LastUpdated = ts; return m },
		r.resolveAssetLastUpdated,
		r.logger,
	)
}

// annotateLastUpdated resolves the latest-update timestamp for every manifest
// without making any network calls, and returns only the manifests that could
// be resolved.
//
// Historically last_updated was derived by fanning out one GitHub releases
// request per listing (plus a manifest.json fetch per release) on every
// registry load, which on a cold start exhausted the unauthenticated GitHub API
// budget. The registry clone already carries everything needed: the manifest
// may publish an authoritative last_updated (emitted by the registry analytics
// pipeline) and the integrity report records a checked_at for every complete
// version. We resolve entirely from that on-disk data and leave live version
// lookups to the on-demand install flow (GetInstallableVersions).
//
// An asset that reaches this point has already passed the integrity filter
// (has a complete version), and every complete version carries a checked_at, so
// resolution effectively always succeeds. When it does not — i.e. malformed
// integrity data with neither a manifest timestamp nor a checked_at — the asset
// is dropped rather than shown with a misleading epoch date, matching the rule
// that only integrity-complete entries are user-visible.
func annotateLastUpdated[T any](
	manifests []T,
	assetType types.AssetType,
	idOf func(T) string,
	lastUpdatedOf func(T) int64,
	withLastUpdated func(T, int64) T,
	resolve func(types.AssetType, string, int64) (int64, bool),
	logger logSink,
) []T {
	kept := make([]T, 0, len(manifests))
	for _, manifest := range manifests {
		ts, ok := resolve(assetType, idOf(manifest), lastUpdatedOf(manifest))
		if !ok {
			logger.Warn(
				"Hiding registry asset with no resolvable last_updated metadata",
				"asset_type", assetType,
				"asset_id", idOf(manifest),
			)
			continue
		}
		kept = append(kept, withLastUpdated(manifest, ts))
	}
	return kept
}

// resolveAssetLastUpdated prefers the manifest-provided timestamp (published by
// the registry pipeline) and falls back to the newest complete-version
// checked_at from the integrity report. The bool is false when neither source
// yields a timestamp, signalling that the asset should not be displayed.
func (r *Registry) resolveAssetLastUpdated(assetType types.AssetType, assetID string, manifestValue int64) (int64, bool) {
	if manifestValue > 0 {
		return manifestValue, true
	}

	fallback, err := r.latestIntegrityCheckedAt(assetType, assetID)
	if err != nil {
		return 0, false
	}
	return fallback, true
}

// latestIntegrityCheckedAt returns the latest complete-version checked_at timestamp for an asset.
func (r *Registry) latestIntegrityCheckedAt(assetType types.AssetType, assetID string) (int64, error) {
	listing, _ := r.getIntegrityListing(assetType, assetID)

	best := int64(0)
	for version, status := range listing.Versions {
		if !status.IsComplete {
			continue
		}
		if status.CheckedAt == "" {
			return 0, fmt.Errorf("%s %q version %q is missing checked_at", assetType, assetID, version)
		}
		parsed, err := time.Parse(time.RFC3339, status.CheckedAt)
		if err != nil {
			return 0, fmt.Errorf("%s %q version %q has invalid checked_at %q: %w", assetType, assetID, version, status.CheckedAt, err)
		}
		timestamp := parsed.Unix()
		if timestamp > best {
			best = timestamp
		}
	}

	if best == 0 {
		return 0, fmt.Errorf("%s %q has no complete versions with checked_at", assetType, assetID)
	}

	return best, nil
}

// determineLatestTimestamp iterates through a list of versions to find the most recent stable release timestamp, falling back to a prerelease timestamp if no stable version is available.
//
// It is retained for the on-demand version-resolution path and unit coverage of
// version-date parsing; the registry load path no longer calls it.
func determineLatestTimestamp(logger logSink, versions []types.VersionInfo, updateType string) (int64, error) {
	const unset = int64(math.MinInt64)
	bestStable := unset
	bestAny := unset

	for _, version := range versions {
		timestamp, ok := parseVersionDate(version.Date, updateType)
		if !ok {
			continue
		}

		if timestamp > bestAny {
			bestAny = timestamp
		}
		// If the version is a release (not a prerelease), consider it for the best stable timestamp
		if !version.Prerelease && timestamp > bestStable {
			bestStable = timestamp
		}
	}

	if bestStable != unset {
		return bestStable, nil
	}
	if bestAny != unset {
		logger.Warn("No stable version found, using latest available version", "timestamp", bestAny)
		return bestAny, nil
	}
	return 0, fmt.Errorf("no parseable version dates")
}

func parseVersionDate(value, updateType string) (int64, bool) {
	if value == "" {
		return 0, false
	}

	var layout string
	switch updateType {
	case "github": // GitHub updates provide full timestamps in RFC3339 format
		layout = time.RFC3339
	case "custom": // Custom URL updates only provide a date without a time component -- assume start of day UTC
		layout = "2006-01-02"
	default:
		return 0, false
	}

	parsed, err := time.Parse(layout, value)
	if err != nil {
		return 0, false
	}
	return parsed.Unix(), true
}
