package registry

import (
	"errors"
	"fmt"
	"math"
	"sync"
	"time"

	"railyard/internal/types"
)

const lastUpdatedWorkerLimit = 6

type lastUpdatedArgs struct {
	assetType  types.AssetType
	id         string
	updateType string
}

func (r *Registry) loadLastUpdated(
	mods []types.ModManifest,
	maps []types.MapManifest,
) (map[string]int64, map[string]int64) {
	r.logger.Info(
		"Resolving last updated metadata",
		"mod_count",
		len(mods),
		"map_count",
		len(maps),
	)

	mapSources := getLastUpdatedArgs(
		maps,
		func(manifest types.MapManifest) types.AssetType { return types.AssetTypeMap },
		func(manifest types.MapManifest) string { return manifest.ID },
		func(manifest types.MapManifest) string { return manifest.Update.Type },
	)
	modSources := getLastUpdatedArgs(
		mods,
		func(manifest types.ModManifest) types.AssetType { return types.AssetTypeMod },
		func(manifest types.ModManifest) string { return manifest.ID },
		func(manifest types.ModManifest) string { return manifest.Update.Type },
	)

	mapEntries, mapWarnings := r.resolveLastUpdated(mapSources)
	modEntries, modWarnings := r.resolveLastUpdated(modSources)

	if len(mapWarnings) > 0 {
		r.logger.Warn("Last updated metadata resolved with warnings", "asset_type", types.AssetTypeMap, "warning_count", len(mapWarnings))
	}
	if len(modWarnings) > 0 {
		r.logger.Warn("Last updated metadata resolved with warnings", "asset_type", types.AssetTypeMod, "warning_count", len(modWarnings))
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

// resolveLastUpdated fetches version information for each source in parallel, returning a map of the latest update timestamp for each asset ID.
func (r *Registry) resolveLastUpdated(
	sources []lastUpdatedArgs,
) (map[string]int64, []error) {
	results := make(map[string]int64, len(sources))
	warnings := make([]error, 0)

	if len(sources) == 0 {
		return results, warnings
	}

	workerLimit := lastUpdatedWorkerLimit
	if len(sources) < workerLimit {
		workerLimit = len(sources)
	}
	sem := make(chan struct{}, workerLimit)
	var wg sync.WaitGroup
	var mu sync.Mutex

	for _, source := range sources {
		current := source
		wg.Add(1)
		go func() {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			versions, err := r.GetInstallableVersions(current.assetType, current.id)
			if err != nil {
				r.logger.Warn("Failed to fetch installable versions for last updated", "asset_type", current.assetType, "asset_id", current.id, "error", err)
				mu.Lock()
				warnings = append(warnings, fmt.Errorf("failed to fetch versions for %q: %w", current.id, err))
				results[current.id] = 0 // Default to epoch start if we can't fetch version
				mu.Unlock()
				return
			}

			latest, err := determineLatestTimestamp(r.logger, versions, current.updateType)
			if err != nil {
				fallback, fallbackErr := r.latestIntegrityCheckedAt(current.assetType, current.id)
				if fallbackErr != nil {
					r.logger.Warn("Failed to parse version dates for last updated", "asset_id", current.id, "version_count", len(versions), "error", err)
					mu.Lock()
					warnings = append(warnings, fmt.Errorf("failed to resolve latest update for %q: %w", current.id, errors.Join(err, fallbackErr)))
					results[current.id] = 0 // Default to epoch start if we can't parse version dates
					mu.Unlock()
					return
				}

				r.logger.Warn("Falling back to integrity checked_at for last updated", "asset_type", current.assetType, "asset_id", current.id, "error", err, "timestamp", fallback)
				mu.Lock()
				results[current.id] = fallback
				mu.Unlock()
				return
			}

			mu.Lock()
			results[current.id] = latest
			mu.Unlock()
		}()
	}

	wg.Wait()
	return results, warnings
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

// getLastUpdatedArgs converts manifests into the asset identifiers needed for installable version lookups.
func getLastUpdatedArgs[T any](
	manifests []T,
	assetTypeFn func(manifest T) types.AssetType,
	idFn func(manifest T) string,
	updateTypeFn func(manifest T) string,
) []lastUpdatedArgs {
	sources := make([]lastUpdatedArgs, 0, len(manifests))
	for _, manifest := range manifests {
		sources = append(sources, lastUpdatedArgs{
			assetType:  assetTypeFn(manifest),
			id:         idFn(manifest),
			updateType: updateTypeFn(manifest),
		})
	}
	return sources
}

// determineLatestTimestamp iterates through a list of versions to find the most recent stable release timestamp, falling back to a prerelease timestamp if no stable version is available.
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
