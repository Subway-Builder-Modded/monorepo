package registry

import (
	"fmt"
	"math"
	"time"

	"railyard/internal/types"
)

// modManifestBase and mapManifestBase expose the embedded AssetManifest so the
// generic enrichLastUpdated can read and write last_updated for any asset type.
func modManifestBase(m *types.ModManifest) *types.AssetManifest { return &m.AssetManifest }
func mapManifestBase(m *types.MapManifest) *types.AssetManifest { return &m.AssetManifest }

// enrichLastUpdated resolves each manifest's last_updated from on-disk data
// (manifest value, else integrity checked_at) and returns only the manifests
// that resolved one — leaving live version lookups to the on-demand install
// flow. A miss implies malformed integrity data, so the asset is dropped rather
// than surfaced with a misleading epoch date, consistent with only
// integrity-complete entries being user-visible. base yields the embedded
// AssetManifest, letting one implementation serve every asset type.
func enrichLastUpdated[T any](
	manifests []T,
	assetType types.AssetType,
	base func(*T) *types.AssetManifest,
	resolve func(types.AssetType, string, int64) (int64, bool),
	logger logSink,
) []T {
	kept := make([]T, 0, len(manifests))
	for i := range manifests {
		asset := base(&manifests[i])
		ts, ok := resolve(assetType, asset.ID, asset.LastUpdated)
		if !ok {
			logger.Warn(
				"Hiding registry asset with no resolvable last_updated metadata",
				"asset_type", assetType,
				"asset_id", asset.ID,
			)
			continue
		}
		asset.LastUpdated = ts
		kept = append(kept, manifests[i])
	}
	return kept
}

// resolveAssetLastUpdated prefers the manifest-provided timestamp (published by the registry pipeline) and falls back to the newest complete-version checked_at from the integrity report.
// The second return boolean value is false when neither source yields a timestamp, signalling a malformed asset integrity state that should be dropped.
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
// This is retained for the on-demand version-resolution path; the registry load path no longer calls it.
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
