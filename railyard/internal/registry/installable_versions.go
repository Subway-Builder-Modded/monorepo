package registry

import (
	"fmt"
	"sort"
	"strings"

	"railyard/internal/types"

	semver "github.com/Masterminds/semver/v3"
)

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

// AssetMissingInstallableVersion reports whether the loaded integrity report definitively lists no
// installable (complete) version for the asset (delisted or never approved). It returns false when no
// integrity report is loaded for the asset type, so an unloaded or unreachable registry is never
// treated as "definitively none".
func (r *Registry) AssetMissingInstallableVersion(assetType types.AssetType, assetID string) bool {
	report, err := r.GetIntegrityReport(assetType)
	if err != nil || len(report.Listings) == 0 {
		return false
	}
	listing, ok := r.getIntegrityListing(assetType, assetID)
	return !ok || !listing.HasCompleteVersion
}

// assetDeprecation returns the asset's retirement record from its retained
// manifest, or nil when the asset is unknown or not retired.
func (r *Registry) assetDeprecation(assetType types.AssetType, assetID string) *types.Deprecation {
	switch assetType {
	case types.AssetTypeMod:
		if manifest := r.findRawMod(assetID); manifest != nil {
			return manifest.Deprecation
		}
	case types.AssetTypeMap:
		if manifest := r.findRawMap(assetID); manifest != nil {
			return manifest.Deprecation
		}
	}
	return nil
}

// AssetDeleted reports whether the asset was permanently deleted by its author.
func (r *Registry) AssetDeleted(assetType types.AssetType, assetID string) bool {
	deprecation := r.assetDeprecation(assetType, assetID)
	return deprecation != nil && deprecation.Deleted
}

// AssetDeprecatedNotDeleted reports whether the asset is deprecated but not
// deleted — the reversible retirement state that preserves local installs.
func (r *Registry) AssetDeprecatedNotDeleted(assetType types.AssetType, assetID string) bool {
	deprecation := r.assetDeprecation(assetType, assetID)
	return deprecation != nil && !deprecation.Deleted
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

// GetInstallableVersionsFromIntegrity returns the integrity-approved installable versions for
// an asset built solely from the loaded integrity report.
// This is the fast path for startup reconcile/update, which only needs to know which versions exist and are
// game-compatible; this avoids a Github conditional request per subscription.
func (r *Registry) GetInstallableVersionsFromIntegrity(assetType types.AssetType, assetID string) ([]types.VersionInfo, error) {
	listing, ok := r.getIntegrityListing(assetType, assetID)
	if !ok {
		return nil, fmt.Errorf("%s %q is missing from integrity cache", assetType, assetID)
	}
	if !listing.HasCompleteVersion {
		return nil, fmt.Errorf("%s %q has no complete versions in integrity cache", assetType, assetID)
	}

	versions := make([]types.VersionInfo, 0, len(listing.Versions))
	for version, status := range listing.Versions {
		if !status.IsComplete {
			continue
		}
		// Only the fields needed to resolve versions are populated; download URLs and changelogs are absent.
		vi := types.VersionInfo{
			Version:      version,
			GameVersion:  status.GameVersion,
			Dependencies: status.Dependencies,
		}
		if assetType == types.AssetTypeMap {
			vi.MapBuildingsConstraint = buildingsIndexConstraintFromMatchedFiles(status.MatchedFiles)
		}
		versions = append(versions, vi)
	}
	return versions, nil
}

// GetInstallableVersions returns the integrity-approved versions for an asset.
// Install and dependency-resolution flows rely on every returned version being
// downloadable; display-only unavailable versions are never included here.
func (r *Registry) GetInstallableVersions(assetType types.AssetType, assetID string) ([]types.VersionInfo, error) {
	versions, _, err := r.resolveFilteredVersions(assetType, assetID)
	return versions, err
}

// GetDisplayableVersions returns the installable versions plus display-only
// entries for versions the registry marks retired/removed, so the UI can render
// the full version history with frozen download counts and changelogs.
func (r *Registry) GetDisplayableVersions(assetType types.AssetType, assetID string) ([]types.VersionInfo, error) {
	filtered, upstream, err := r.resolveFilteredVersions(assetType, assetID)
	if err != nil {
		return nil, err
	}

	listing, ok := r.getIntegrityListing(assetType, assetID)
	if !ok {
		return filtered, nil
	}

	upstreamByVersion := make(map[string]types.VersionInfo, len(upstream))
	for _, version := range upstream {
		upstreamByVersion[version.Version] = version
	}

	appended := false
	for version, status := range listing.Versions {
		// Unavailable entries are always incomplete, so they can never collide
		// with the integrity-filtered installable list.
		if status.Availability == "" || status.IsComplete {
			continue
		}
		info, hasUpstream := upstreamByVersion[version]
		if !hasUpstream {
			info = types.VersionInfo{Version: version}
		}
		info.Availability = status.Availability
		// Display-only: never expose install artifacts, even if the upstream
		// source still lists a (dead) URL.
		info.DownloadURL = ""
		info.SHA256 = ""
		info.Manifest = ""
		if info.Date == "" {
			info.Date = status.ReleasedAt
		}
		if info.GameVersion == "" {
			info.GameVersion = status.GameVersion
		}
		if len(info.Dependencies) == 0 {
			info.Dependencies = status.Dependencies
		}
		// MapBuildingsConstraint is deliberately left as-is: unavailable entries
		// carry empty matched_files, and deriving a constraint from that would
		// falsely flag them as incompatible.
		filtered = append(filtered, info)
		appended = true
	}
	if appended {
		sortSemverVersions(filtered)
	}

	return filtered, nil
}

// resolveFilteredVersions fetches the upstream version list and returns the
// integrity-complete subset (enriched for maps) alongside the raw upstream list.
func (r *Registry) resolveFilteredVersions(assetType types.AssetType, assetID string) ([]types.VersionInfo, []types.VersionInfo, error) {
	updateType, source, err := r.resolveAssetUpdateSource(assetType, assetID)
	if err != nil {
		return nil, nil, err
	}

	versions, err := r.GetVersions(updateType, source)
	if err != nil {
		return nil, nil, err
	}

	filtered, err := r.filterVersionsByIntegrity(assetType, assetID, versions)
	if err != nil {
		return nil, nil, err
	}

	// For maps, enrich each version with its buildings-index constraint derived from
	// the integrity report's matched_files. This is the authoritative source for remote maps.
	if assetType == types.AssetTypeMap {
		if listing, ok := r.getIntegrityListing(assetType, assetID); ok {
			for i := range filtered {
				if status, ok := listing.Versions[filtered[i].Version]; ok {
					filtered[i].MapBuildingsConstraint = buildingsIndexConstraintFromMatchedFiles(status.MatchedFiles)
				}
			}
		}
	}

	return filtered, versions, nil
}

// integrityVersionConstraints builds a version's compatibility constraints from its integrity record.
func integrityVersionConstraints(assetType types.AssetType, status types.IntegrityVersionStatus) []types.InstalledConstraint {
	vi := types.VersionInfo{GameVersion: status.GameVersion}
	if assetType == types.AssetTypeMap {
		// Maps also constrain by buildings-index format, inferred from the integrity matched_files.
		vi.MapBuildingsConstraint = buildingsIndexConstraintFromMatchedFiles(status.MatchedFiles)
	}
	return types.ConstraintsFromVersionInfo(assetType, vi)
}

// listingHasGameCompatibleVersion reports whether any integrity-complete version satisfies the game version.
func listingHasGameCompatibleVersion(assetType types.AssetType, listing types.IntegrityListing, gameVersion *semver.Version) bool {
	for _, status := range listing.Versions {
		if !status.IsComplete {
			continue
		}
		if types.ConstraintsSatisfied(gameVersion, integrityVersionConstraints(assetType, status)) {
			return true
		}
	}
	return false
}

// GameIncompatibleAssets returns the IDs of assets whose installable versions are all incompatible
// with the game version, derived from the loaded integrity report (no remote fetch).
func (r *Registry) GameIncompatibleAssets(assetType types.AssetType, gameVersion string) types.GameIncompatibleAssetsResponse {
	resp := types.GameIncompatibleAssetsResponse{
		AssetType: string(assetType),
		AssetIDs:  []string{},
	}
	if !types.IsValidAssetType(assetType) {
		r.logger.Warn("GameIncompatibleAssets rejected invalid asset type", "asset_type", assetType)
		resp.GenericResponse = types.ErrorResponse(fmt.Sprintf("invalid asset type %q", assetType))
		return resp
	}

	// Unknown or unparseable game version is not a verdict — flag nothing.
	trimmed := strings.TrimSpace(gameVersion)
	if trimmed == "" {
		resp.GenericResponse = types.SuccessResponse("No game version detected; no assets flagged")
		return resp
	}
	gameVer, err := types.ParseSemver(trimmed)
	if err != nil {
		resp.GenericResponse = types.SuccessResponse("Game version unparseable; no assets flagged")
		return resp
	}

	report, err := r.GetIntegrityReport(assetType)
	if err != nil || len(report.Listings) == 0 {
		// No integrity loaded (early startup / unreachable): cannot judge, so flag nothing.
		resp.GenericResponse = types.SuccessResponse("No integrity report loaded; no assets flagged")
		return resp
	}

	for assetID, listing := range report.Listings {
		// No installable version at all is "delisted", not game-incompatible.
		if !listing.HasCompleteVersion {
			continue
		}
		if listingHasGameCompatibleVersion(assetType, listing, gameVer) {
			continue
		}
		resp.AssetIDs = append(resp.AssetIDs, assetID)
	}
	sort.Strings(resp.AssetIDs)

	resp.GenericResponse = types.SuccessResponse("Game-incompatible assets computed")
	return resp
}

// GetInstallableVersionsResponse returns the UI-facing version list — installable
// versions plus display-only retired/removed entries — with response metadata.
func (r *Registry) GetInstallableVersionsResponse(assetType types.AssetType, assetID string) types.VersionsResponse {
	versions, err := r.GetDisplayableVersions(assetType, assetID)
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
