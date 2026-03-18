package registry

import (
	"railyard/internal/types"
)

func mapConfigFromManifest(manifest *types.MapManifest, version string, existing types.ConfigData) types.ConfigData {
	config := existing
	if manifest == nil {
		config.Version = version
		return config
	}

	config.Code = manifest.CityCode
	config.Name = manifest.Name
	config.Description = manifest.Description
	config.Population = manifest.Population
	config.Creator = manifest.Author
	config.Version = version
	config.Country = &manifest.Country

	return config
}

func installedMapInfoFromManifest(mapID string, version string, manifest *types.MapManifest, existingConfig types.ConfigData) types.InstalledMapInfo {
	return types.InstalledMapInfo{
		ID:        mapID,
		Version:   version,
		MapConfig: mapConfigFromManifest(manifest, version, existingConfig),
	}
}

func installedModInfoFromManifest(modID string, version string, manifest *types.ModManifest) types.InstalledModInfo {
	if manifest != nil && modID == "" {
		modID = manifest.ID
	}
	return types.InstalledModInfo{
		ID:      modID,
		Version: version,
	}
}
