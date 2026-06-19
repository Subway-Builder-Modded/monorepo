package registry

import (
	"fmt"
	"math"
	"time"

	"railyard/internal/types"
)

// loadLastUpdated resolves the latest-update timestamp for every mod and map
// without making any network calls.
//
// Historically this fanned out one GitHub releases request per listing (plus a
// manifest.json fetch per release) on every registry load, which on a cold
// start exhausted the unauthenticated GitHub API budget. The registry clone
// already carries everything needed: the manifest may publish an authoritative
// last_updated (emitted by the registry analytics pipeline) and the integrity
// report records a checked_at timestamp for every complete version. We resolve
// entirely from that on-disk data and leave live version lookups to the
// on-demand install flow (GetInstallableVersions).
func (r *Registry) loadLastUpdated(
	mods []types.ModManifest,
	maps []types.MapManifest,
) (map[string]int64, map[string]int64) {
	r.logger.Info(
		"Resolving last updated metadata from disk",
		"mod_count",
		len(mods),
		"map_count",
		len(maps),
	)

	modEntries := make(map[string]int64, len(mods))
	for _, m := range mods {
		modEntries[m.ID] = r.resolveAssetLastUpdated(types.AssetTypeMod, m.ID, m.LastUpdated)
	}
	mapEntries := make(map[string]int64, len(maps))
	for _, m := range maps {
		mapEntries[m.ID] = r.resolveAssetLastUpdated(types.AssetTypeMap, m.ID, m.LastUpdated)
	}

	r.logger.Info(
		"Resolved last updated metadata",
		"resolved_mods",
		len(modEntries),
		"resolved_maps",
		len(mapEntries),
	)

	return modEntries, mapEntries
}

// resolveAssetLastUpdated prefers the manifest-provided timestamp (published by
// the registry pipeline) and falls back to the newest complete-version
// checked_at from the integrity report. Returns 0 (epoch) when neither is
// available so the asset still sorts predictably.
func (r *Registry) resolveAssetLastUpdated(assetType types.AssetType, assetID string, manifestValue int64) int64 {
	if manifestValue > 0 {
		return manifestValue
	}

	fallback, err := r.latestIntegrityCheckedAt(assetType, assetID)
	if err != nil {
		r.logger.Warn("No last updated metadata available; defaulting to epoch", "asset_type", assetType, "asset_id", assetID, "error", err)
		return 0
	}
	return fallback
}

func updateManifestLastUpdated(
	mods []types.ModManifest,
	maps []types.MapManifest,
	modLastUpdated map[string]int64,
	mapLastUpdated map[string]int64,
) {
	for i := range mods {
		mods[i].LastUpdated = modLastUpdated[mods[i].ID]
	}
	for i := range maps {
		maps[i].LastUpdated = mapLastUpdated[maps[i].ID]
	}
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
