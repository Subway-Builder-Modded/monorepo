package registry

import (
	"fmt"
	"strings"
	"time"

	"railyard/internal/constants"
	"railyard/internal/types"
)

var mapSchemaCompatibilityCutoff = time.Date(2026, time.May, 18, 0, 0, 0, 0, time.UTC)

// getIntegrityListing returns the integrity entry for the requested asset.
func (r *Registry) getIntegrityListing(assetType types.AssetType, assetID string) (types.IntegrityListing, bool) {
	switch assetType {
	case types.AssetTypeMod:
		listing, ok := r.integrityMods.Listings[assetID]
		return listing, ok
	case types.AssetTypeMap:
		listing, ok := r.integrityMaps.Listings[assetID]
		return listing, ok
	default:
		return types.IntegrityListing{}, false
	}
}

// resolveAssetUpdateSource resolves the raw update source for an asset manifest.
func (r *Registry) resolveAssetUpdateSource(assetType types.AssetType, assetID string) (string, string, error) {
	switch assetType {
	case types.AssetTypeMod:
		manifest, err := r.GetMod(assetID)
		if err != nil {
			return "", "", err
		}
		return manifest.Update.Type, manifest.Update.Source(), nil
	case types.AssetTypeMap:
		manifest, err := r.GetMap(assetID)
		if err != nil {
			return "", "", err
		}
		return manifest.Update.Type, manifest.Update.Source(), nil
	default:
		return "", "", fmt.Errorf("invalid asset type: %s", assetType)
	}
}

// filterVersionsByIntegrity keeps only versions marked complete in the integrity cache.
func (r *Registry) filterVersionsByIntegrity(
	assetType types.AssetType,
	assetID string,
	versions []types.VersionInfo,
) ([]types.VersionInfo, error) {
	listing, ok := r.getIntegrityListing(assetType, assetID)
	if !ok {
		return nil, fmt.Errorf("%s %q is missing from integrity cache", assetType, assetID)
	}
	if !listing.HasCompleteVersion {
		return nil, fmt.Errorf("%s %q has no complete versions in integrity cache", assetType, assetID)
	}

	allowedVersions := make(map[string]struct{}, len(listing.CompleteVersions)+len(listing.Versions))
	for _, version := range listing.CompleteVersions {
		allowedVersions[version] = struct{}{}
	}
	for version, status := range listing.Versions {
		if status.IsComplete {
			allowedVersions[version] = struct{}{}
		}
	}

	filtered := make([]types.VersionInfo, 0, len(versions))
	for _, version := range versions {
		if _, ok := allowedVersions[version.Version]; ok {
			filtered = append(filtered, version)
		}
	}
	return filtered, nil
}

// applyMapGameVersionPolicy enforces map-specific compatibility defaults and cutoffs.
func applyMapGameVersionPolicy(versions []types.VersionInfo) {
	for i := range versions {
		if strings.TrimSpace(versions[i].GameVersion) == "" {
			versions[i].GameVersion = constants.DefaultMapGameVersionConstraint
			continue
		}

		if !isOnOrBeforeMapSchemaCompatibilityCutoff(versions[i].Date) {
			continue
		}

		// Subway Builder 1.3.1 introduces a schema-breaking map change. Keep the
		// 2026-05-18 (Monday) cutoff hardcoded so any map published on or before
		// that date stays capped at 1.3.0 unless the policy is intentionally
		// revised here.
		versions[i].GameVersion = strings.TrimSpace(versions[i].GameVersion + " " + constants.DefaultMapGameVersionConstraint)
	}
}

// isOnOrBeforeMapSchemaCompatibilityCutoff reports whether the version date falls on or before the schema cutoff.
func isOnOrBeforeMapSchemaCompatibilityCutoff(rawDate string) bool {
	publishedAt, ok := parseMapPolicyVersionDate(rawDate)
	return ok && !publishedAt.After(mapSchemaCompatibilityCutoff)
}

// parseMapPolicyVersionDate parses supported version date formats into a UTC day value.
func parseMapPolicyVersionDate(rawDate string) (time.Time, bool) {
	trimmed := strings.TrimSpace(rawDate)
	if trimmed == "" {
		return time.Time{}, false
	}

	layout := time.DateOnly
	if strings.Contains(trimmed, "T") {
		layout = time.RFC3339Nano
	}

	parsed, err := time.Parse(layout, trimmed)
	if err != nil {
		return time.Time{}, false
	}

	parsed = parsed.UTC()
	if layout == time.DateOnly {
		return parsed, true
	}

	return time.Date(parsed.Year(), parsed.Month(), parsed.Day(), 0, 0, 0, 0, time.UTC), true
}

// GetInstallableVersions returns the integrity-approved versions for an asset.
func (r *Registry) GetInstallableVersions(assetType types.AssetType, assetID string) ([]types.VersionInfo, error) {
	updateType, source, err := r.resolveAssetUpdateSource(assetType, assetID)
	if err != nil {
		return nil, err
	}

	versions, err := r.GetVersions(updateType, source)
	if err != nil {
		return nil, err
	}

	filtered, err := r.filterVersionsByIntegrity(assetType, assetID, versions)
	if err != nil {
		return nil, err
	}

	if assetType == types.AssetTypeMap {
		applyMapGameVersionPolicy(filtered)
	}

	return filtered, nil
}

// GetInstallableVersionsResponse returns installable versions with response metadata.
func (r *Registry) GetInstallableVersionsResponse(assetType types.AssetType, assetID string) types.VersionsResponse {
	versions, err := r.GetInstallableVersions(assetType, assetID)
	if err != nil {
		return types.VersionsResponse{
			GenericResponse: types.ErrorResponse(err.Error()),
			Versions:        []types.VersionInfo{},
		}
	}

	return types.VersionsResponse{
		GenericResponse: types.SuccessResponse("Installable versions loaded"),
		Versions:        versions,
	}
}
