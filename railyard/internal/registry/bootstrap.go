package registry

import (
	"fmt"
	"strings"

	"railyard/internal/constants"
	"railyard/internal/files"
	"railyard/internal/paths"
	"railyard/internal/types"
)

// BootstrapInstalledStateFromProfile rebuilds installed_mods/installed_maps from active profile subscriptions and on-disk marker checks, then persists the rebuilt state.
// This is primarily used when the installed_maps/mods are corrupted/incomplete to avoid having the user deal with a long queue of downloads for already-installed assets
func (r *Registry) BootstrapInstalledStateFromProfile(profile types.UserProfile) error {
	r.logger.Info(
		"Bootstrapping installed asset state from profile subscriptions",
		"profile_id", profile.ID,
		"subscriptions", profile.Subscriptions,
	)
	nextInstalledMods := r.bootstrapInstalledMods(profile.Subscriptions, r.config.Cfg.GetModsFolderPath())
	nextInstalledMaps := r.bootstrapInstalledMaps(profile.Subscriptions, r.config.Cfg.GetMapsFolderPath())

	previousMods := r.installedMods
	previousMaps := r.installedMaps
	r.installedMods = nextInstalledMods
	r.installedMaps = nextInstalledMaps

	if err := r.WriteInstalledToDisk(); err != nil {
		r.installedMods = previousMods
		r.installedMaps = previousMaps
		return fmt.Errorf("failed to persist bootstrapped installed state: %w", err)
	}

	r.logger.Info(
		"Bootstrapped installed asset state from profile subscriptions",
		"profile_id", profile.ID,
		"installed_mods_count", len(nextInstalledMods),
		"installed_maps_count", len(nextInstalledMaps),
	)
	return nil
}

func (r *Registry) bootstrapInstalledMods(subscriptions types.Subscriptions, modInstallRoot string) []types.InstalledModInfo {
	r.logger.Info("Bootstrapping installed mods from subscriptions", "subscriptions", subscriptions.Mods)

	installedMods := make([]types.InstalledModInfo, 0, len(subscriptions.Mods))
	for modID, version := range subscriptions.Mods {
		modPath := paths.JoinLocalPath(modInstallRoot, modID)
		if !r.hasAssetMarker(types.AssetTypeMod, modID, modInstallRoot, modID) {
			continue
		}
		// Validate the manifest exists + matches the subscribed version to avoid bootstrapping out-of-date or corrupted mods
		installedManifest, manifestErr := readInstalledModManifest(modPath, version)
		if manifestErr != nil {
			r.logger.Warn(
				"Skipping subscribed mod during installed-state bootstrap: invalid/mismatched manifest",
				"mod_id", modID,
				"manifest_path", paths.JoinLocalPath(modPath, constants.MANIFEST_JSON),
				"expected_version", version,
				"error", manifestErr,
			)
			continue
		}

		installedMods = append(installedMods, installedModInfoFromManifest(modID, version, &installedManifest))
	}

	return installedMods
}

func (r *Registry) bootstrapInstalledMaps(subscriptions types.Subscriptions, mapInstallRoot string) []types.InstalledMapInfo {
	r.logger.Info("Bootstrapping installed maps from subscriptions", "subscriptions", subscriptions.Maps)

	installedMaps := make([]types.InstalledMapInfo, 0, len(subscriptions.Maps)+len(subscriptions.LocalMaps))
	installedMapById := make(map[string]types.InstalledMapInfo, len(r.installedMaps))
	for _, installed := range r.installedMaps {
		installedMapById[installed.ID] = installed
	}

	for mapID, version := range subscriptions.Maps {
		if installedMap, ok := r.bootstrapMapSubscription(mapID, version, mapInstallRoot, false, installedMapById); ok {
			installedMaps = append(installedMaps, installedMap)
		}
	}

	for localMapID, version := range subscriptions.LocalMaps {
		if installedMap, ok := r.bootstrapMapSubscription(localMapID, version, mapInstallRoot, true, installedMapById); ok {
			installedMaps = append(installedMaps, installedMap)
		}
	}

	return installedMaps
}

func (r *Registry) bootstrapMapSubscription(
	mapID string,
	version string,
	mapInstallRoot string,
	isLocal bool,
	installedMapByID map[string]types.InstalledMapInfo,
) (types.InstalledMapInfo, bool) {
	var manifest *types.MapManifest
	var diskConfig *types.ConfigData
	cityCode := mapID

	if isLocal {
		// Local maps require config to be present on disk since fields are not available from remote manifest
		cfg, ok := r.validateMapData(mapID, version, mapInstallRoot, cityCode, true)
		if !ok {
			return types.InstalledMapInfo{}, false
		}
		diskConfig = &cfg
	} else {
		if resolvedManifest, err := r.GetMap(mapID); err == nil {
			manifest = resolvedManifest
			cityCode = manifest.CityCode
		} else {
			installed, ok := installedMapByID[mapID]
			if !ok || installed.MapConfig.Code == "" {
				r.logger.Warn("Skipping subscribed map during installed-state bootstrap: missing manifest and no installed fallback", "map_id", mapID, "error", err)
				return types.InstalledMapInfo{}, false
			}
			cityCode = installed.MapConfig.Code
		}
		cfg, ok := r.validateMapData(mapID, version, mapInstallRoot, cityCode, false)
		if !ok {
			return types.InstalledMapInfo{}, false
		}
		diskConfig = &cfg
	}

	config, ok := r.resolveConfig(installedMapByID[mapID], diskConfig, manifest, version, cityCode)
	if !ok {
		r.logger.Warn("Skipping subscribed map during installed-state bootstrap: invalid config", "map_id", mapID, "map_code", cityCode, "is_local", isLocal)
		return types.InstalledMapInfo{}, false
	}
	return types.InstalledMapInfo{ID: mapID, Version: version, IsLocal: isLocal, MapConfig: config}, true
}

func (r *Registry) resolveConfig(
	installed types.InstalledMapInfo,
	diskConfig *types.ConfigData,
	manifest *types.MapManifest,
	version string,
	cityCode string,
) (types.ConfigData, bool) {
	var config types.ConfigData
	switch {
	case diskConfig != nil:
		config = *diskConfig
	case installed.MapConfig.Code != "":
		config = installed.MapConfig
	case manifest != nil:
		config = mapConfigFromManifest(manifest, version)
	default:
		return types.ConfigData{}, false
	}

	config.Name = types.Coalesce(config.Name, installed.MapConfig.Name)
	config.Description = types.Coalesce(config.Description, installed.MapConfig.Description)
	config.Population = types.Coalesce(config.Population, installed.MapConfig.Population)
	config.Creator = types.Coalesce(config.Creator, installed.MapConfig.Creator)
	config.Country = types.CoalescePtr(config.Country, installed.MapConfig.Country)
	config.InitialViewState = types.CoalesceBy(
		isZeroInitialViewState,
		config.InitialViewState,
		installed.MapConfig.InitialViewState,
	)

	config.Code = cityCode
	config.Version = version

	if manifest != nil {
		// Recover any missing metadata from the registry manifest, but prefer on-disk config.json.
		config.Name = types.Coalesce(config.Name, manifest.Name)
		config.Description = types.Coalesce(config.Description, manifest.Description)
		config.Population = types.Coalesce(config.Population, manifest.Population)
		config.Creator = types.Coalesce(config.Creator, manifest.Author.AuthorAlias)
		config.Country = types.CoalescePtr(config.Country, types.Ptr(manifest.Country))
		config.InitialViewState = types.CoalesceBy(
			isZeroInitialViewState,
			config.InitialViewState,
			manifest.InitialViewState,
		)
	}
	return config, true
}

func isZeroInitialViewState(state types.InitialViewState) bool {
	return state.Latitude == 0 &&
		state.Longitude == 0 &&
		state.Zoom == 0 &&
		state.Bearing == 0 &&
		state.Pitch == nil
}

func (r *Registry) validateMapData(
	assetID string,
	assetVersion string,
	mapInstallRoot string,
	cityCode string,
	isLocal bool,
) (types.ConfigData, bool) {
	if !r.hasAssetMarker(types.AssetTypeMap, assetID, mapInstallRoot, cityCode) {
		return types.ConfigData{}, false
	}
	configFromDisk, errorType, validationErr := files.ValidateInstalledMapData(mapInstallRoot, paths.TilesPath(), cityCode, isLocal)
	if validationErr != nil {
		r.logger.Warn("Skipping subscribed map during installed-state bootstrap: missing downloaded map data files", "map_id", assetID,
			"map_code", cityCode,
			"error_type", errorType,
			"error", validationErr,
			"is_local", isLocal)
		return types.ConfigData{}, false
	}
	if !isLocal && configFromDisk.Version != "" && strings.TrimPrefix(assetVersion, "v") != strings.TrimPrefix(configFromDisk.Version, "v") {
		r.logger.Warn("Skipping subscribed map during installed-state bootstrap: installed version does not match subscribed version", "map_id", assetID, "map_code", cityCode, "installed_version", configFromDisk.Version, "subscribed_version", assetVersion)
		return types.ConfigData{}, false
	}
	return configFromDisk, true
}

// readInstalledModManifest reads the installed manifest.json and validates that its version matches the subscribed version.
func readInstalledModManifest(modPath string, expectedVersion string) (types.MetroMakerModManifest, error) {
	manifestPath := paths.JoinLocalPath(modPath, constants.MANIFEST_JSON)
	manifest, err := files.ReadJSON[types.MetroMakerModManifest](manifestPath, "installed mod manifest", files.JSONReadOptions{})
	if err != nil {
		return types.MetroMakerModManifest{}, err
	}
	semverExpected, semverActual := types.NormalizeSemver(expectedVersion), types.NormalizeSemver(manifest.Version)

	if semverExpected != semverActual {
		return types.MetroMakerModManifest{}, fmt.Errorf("manifest version mismatch: expected %s, got %s", semverExpected, semverActual)
	}
	return manifest, nil
}

// hasAssetMarker checks for the presence of the .railyard_asset marker file in the expected location for the given asset, logging a warning if it is missing to avoid bootstrapping assets that may not be managed by Railyard or are corrupted/missing
func (r *Registry) hasAssetMarker(assetType types.AssetType, assetID string, installRoot string, markerPathPart string) bool {
	assetDirPath := paths.JoinLocalPath(installRoot, markerPathPart)
	markerPath := paths.JoinLocalPath(assetDirPath, constants.RailyardAssetMarker)
	hasMarker, err := files.HasAssetMarker(assetDirPath, constants.RailyardAssetMarker)
	if err != nil {
		r.logger.Warn(
			"Skipping subscribed asset during installed-state bootstrap: failed to verify marker",
			"asset_type", assetType,
			"asset_id", assetID,
			"marker_path", markerPath,
			"error", err,
		)
		return false
	}
	if hasMarker {
		return true
	}

	r.logger.Warn(
		"Skipping subscribed asset during installed-state bootstrap: missing marker",
		"asset_type", assetType,
		"asset_id", assetID,
		"marker_path", markerPath,
	)
	return false
}
