package registry

import (
	"fmt"

	"railyard/internal/types"
)

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

func (r *Registry) GetInstallableVersions(assetType types.AssetType, assetID string) ([]types.VersionInfo, error) {
	updateType, source, err := r.resolveAssetUpdateSource(assetType, assetID)
	if err != nil {
		return nil, err
	}

	versions, err := r.GetVersions(updateType, source)
	if err != nil {
		return nil, err
	}

	return r.filterVersionsByIntegrity(assetType, assetID, versions)
}

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
