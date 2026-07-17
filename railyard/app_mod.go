package main

// This file defines map-loader mod generation: assembling the Railyard map-loader mod
// (index.js + manifest) from the installed maps and writing it into the MetroMaker mods
// folder before each game launch.

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path"
	"strings"

	"railyard/internal/constants"
	"railyard/internal/files"
	"railyard/internal/paths"
	"railyard/internal/types"
)

func (a *App) generateMod(port int, skipIncompatibleMaps bool) error {
	maps := a.Registry.GetInstalledMaps()
	a.Logger.Info("Generating mod with maps", "count", len(maps))

	preferBinary := preferBinaryBuildingsIndex(a.GetGameVersion())
	mapDataRoot := paths.MetroMakerMapsDataPath(a.Config.Cfg.MetroMakerDataPath)
	places := make([]types.MetroMakerPlace, 0, len(maps))
	for _, m := range maps {
		if _, err := os.Stat(paths.JoinLocalPath(a.Config.Cfg.GetMapsFolderPath(), m.MapConfig.Code, "ocean_depth_index.json.gz")); !errors.Is(err, fs.ErrNotExist) {
			m.MapConfig.HasOceanDepth = true
		}
		if _, err := os.Stat(paths.JoinLocalPath(paths.AppDataRoot(), "tiles", m.MapConfig.Code+"_foundations.pmtiles")); !errors.Is(err, fs.ErrNotExist) {
			m.MapConfig.HasFoundationTiles = true
		}
		stem, err := setBuildingsIndexStem(mapDataRoot, m.MapConfig.Code, preferBinary)
		if err != nil {
			if skipIncompatibleMaps {
				a.Logger.Warn("Skipping incompatible map from mod template", "map", m.MapConfig.Code, "error", err)
				continue
			}
			stem = files.MapBuildingsFileName
		}
		places = append(places, types.MetroMakerPlace{
			ConfigData:         m.MapConfig,
			BuildingsIndexFile: stem,
		})
	}
	config := types.MetroMakerModConfig{
		Port:          port,
		TileZoomLevel: 15,
		Places:        places,
		Colors:        constants.MAP_COLORS,
		GameVersion:   a.GetGameVersion().Version,
	}
	manifest := types.MetroMakerModManifest{
		Id:          "com.railyard.maploader",
		Name:        "Railyard Map Loader",
		Description: "Loads any custom maps installed by Railyard.",
		Version:     strings.Replace(constants.MOD_VERSION, "v", "", 1),
		Author: struct {
			Name string `json:"name"`
		}{
			Name: "Railyard",
		},
		Main: "index.js",
		Dependencies: map[string]string{
			constants.GameDependencyKey: ">=1.0.0",
		},
	}
	stringifiedConfig, err := json.Marshal(config)
	if err != nil {
		return fmt.Errorf("failed to marshal mod config: %w", err)
	}
	modContent := constants.ModTemplateWithConfig(string(stringifiedConfig))
	manifestContent, err := json.Marshal(manifest)
	if err != nil {
		return fmt.Errorf("failed to marshal mod manifest: %w", err)
	}
	modsFolder := path.Join(a.Config.Cfg.MetroMakerDataPath, "mods", "mapLoader")
	if err := os.MkdirAll(modsFolder, os.ModePerm); err != nil {
		return fmt.Errorf("failed to create mod directory: %w", err)
	}

	if err := os.WriteFile(path.Join(modsFolder, "index.js"), []byte(modContent), 0644); err != nil {
		return fmt.Errorf("failed to write mod index.js: %w", err)
	}

	if err := os.WriteFile(path.Join(modsFolder, "manifest.json"), manifestContent, 0644); err != nil {
		return fmt.Errorf("failed to write mod manifest.json: %w", err)
	}
	return nil
}
