package files

import (
	"archive/zip"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path"
	"strings"

	"railyard/internal/paths"
	"railyard/internal/types"
)

const (
	MapConfigFileName       = "config.json"
	MapDemandFileName       = "demand_data.json"
	MapRoadsFileName        = "roads.geojson"
	MapRunwaysFileName      = "runways_taxiways.geojson"
	MapBuildingsFileName    = "buildings_index.json" // legacy (pre 1.3.0) buildings index format
	MapBuildingsBinFileName = "buildings_index.bin"  // newer (1.3.0+) buildings index format
	MapOceanDepthFileName   = "ocean_depth_index.json"

	MapTileFileExt           = ".pmtiles"
	MapFoundationTileFileExt = "_foundations.pmtiles" // Assuming the same extension for foundation tiles
	MapThumbnailFileExt      = ".svg"

	MapArchiveKeyConfig          = "config"
	MapArchiveKeyDemandData      = "demandData"
	MapArchiveKeyRoads           = "roads"
	MapArchiveKeyRunways         = "runways"
	MapArchiveKeyBuildings       = "buildings"
	MapArchiveKeyBuildingsBin    = "buildingsBin"
	MapArchiveKeyTiles           = "tiles"
	MapArchiveKeyFoundationTiles = "foundationTiles"
	MapArchiveKeyThumbnail       = "thumbnail"
	MapArchiveKeyOceanDepth      = "oceanDepth"
)

// BuildMapArchiveFileIndex builds an index of expected map archive files for validation, returning a map of file keys to their presence and file objects in the archive
func BuildMapArchiveFileIndex(zipFiles []*zip.File) map[string]types.FileFoundStruct {
	filesFound := map[string]types.FileFoundStruct{
		MapArchiveKeyConfig:     {Found: false, FileObject: nil, Required: true},
		MapArchiveKeyDemandData: {Found: false, FileObject: nil, Required: true},
		MapArchiveKeyRoads:      {Found: false, FileObject: nil, Required: true},
		MapArchiveKeyRunways:    {Found: false, FileObject: nil, Required: true},
		// ValidateMapArchive enforces that at least one buildings index is present; neither is strictly required on its own.
		MapArchiveKeyBuildings:       {Found: false, FileObject: nil, Required: false},
		MapArchiveKeyBuildingsBin:    {Found: false, FileObject: nil, Required: false},
		MapArchiveKeyTiles:           {Found: false, FileObject: nil, Required: true},
		MapArchiveKeyFoundationTiles: {Found: false, FileObject: nil, Required: false},
		MapArchiveKeyThumbnail:       {Found: false, FileObject: nil, Required: false},
		MapArchiveKeyOceanDepth:      {Found: false, FileObject: nil, Required: false},
	}

	for _, file := range zipFiles {
		if _, isHelperEntry, _ := SharedAssetPayloadRelativePath(types.AssetTypeMap, file.Name); isHelperEntry {
			continue
		}

		normalizedName, ok := NormalizeArchiveEntryPath(file.Name)
		if !ok || path.Base(normalizedName) != normalizedName {
			continue
		}

		// config.json is never compressed; it is stored verbatim for installed-state bootstrapping.
		if normalizedName == MapConfigFileName {
			filesFound[MapArchiveKeyConfig] = types.FileFoundStruct{Found: true, FileObject: file, Required: true}
		}

		// Payload files may be submitted compressed (<name>.gz) or not; match on the
		// decompressed name so either form maps to the same key. The extractor
		// normalizes them all to <name>.gz on install regardless.
		switch strings.TrimSuffix(normalizedName, ".gz") {
		case MapDemandFileName:
			filesFound[MapArchiveKeyDemandData] = types.FileFoundStruct{Found: true, FileObject: file, Required: true}
		case MapRoadsFileName:
			filesFound[MapArchiveKeyRoads] = types.FileFoundStruct{Found: true, FileObject: file, Required: true}
		case MapRunwaysFileName:
			filesFound[MapArchiveKeyRunways] = types.FileFoundStruct{Found: true, FileObject: file, Required: true}
		case MapBuildingsFileName:
			filesFound[MapArchiveKeyBuildings] = types.FileFoundStruct{Found: true, FileObject: file, Required: false}
		case MapBuildingsBinFileName:
			filesFound[MapArchiveKeyBuildingsBin] = types.FileFoundStruct{Found: true, FileObject: file, Required: false}
		case MapOceanDepthFileName:
			filesFound[MapArchiveKeyOceanDepth] = types.FileFoundStruct{Found: true, FileObject: file, Required: false}
		}
		if path.Ext(normalizedName) == MapTileFileExt {
			filesFound[MapArchiveKeyTiles] = types.FileFoundStruct{Found: true, FileObject: file, Required: true}
		}
		if path.Ext(normalizedName) == MapThumbnailFileExt {
			filesFound[MapArchiveKeyThumbnail] = types.FileFoundStruct{Found: true, FileObject: file, Required: false}
		}
		if path.Ext(normalizedName) == MapFoundationTileFileExt {
			filesFound[MapArchiveKeyFoundationTiles] = types.FileFoundStruct{Found: true, FileObject: file, Required: false}
		}
	}

	return filesFound
}

// ValidateMapArchive validates required map archive files and parses config.json.
func ValidateMapArchive(filePath string) (types.ConfigData, types.DownloaderErrorType, error) {
	configData := types.ConfigData{}
	reader, err := zip.OpenReader(filePath)
	if err != nil {
		return configData, types.InstallErrorInvalidArchive, err
	}
	defer reader.Close()

	filesFound := BuildMapArchiveFileIndex(reader.File)

	// Report every gap at once (the buildings index counts as one requirement
	// satisfied by either form) so a bad archive surfaces in a single pass.
	missing := missingRequiredFiles(filesFound)
	if !buildingsIndexPresent(filesFound) {
		missing = append(missing,
			fmt.Sprintf("a buildings index (%s or %s)", MapBuildingsFileName, MapBuildingsBinFileName))
	}
	if len(missing) > 0 {
		return configData, types.InstallErrorInvalidArchive, &types.MissingFilesError{Files: missing}
	}

	for _, file := range reader.File {
		relPath, isHelperEntry, helperErr := SharedAssetPayloadRelativePath(types.AssetTypeMap, file.Name)
		if helperErr != nil {
			return configData, types.InstallErrorInvalidArchive, helperErr
		}
		if isHelperEntry && relPath == "" && !file.FileInfo().IsDir() {
			return configData, types.InstallErrorInvalidArchive, fmt.Errorf("shared payload root %q must be a directory", SharedAssetPayloadDir(types.AssetTypeMap))
		}
	}

	configReader, err := filesFound[MapArchiveKeyConfig].FileObject.Open()
	if err != nil {
		return configData, types.InstallErrorInvalidManifest, err
	}
	defer configReader.Close()

	configBytes, err := io.ReadAll(configReader)
	if err != nil {
		return configData, types.InstallErrorInvalidManifest, err
	}

	configData, err = ParseJSON[types.ConfigData](configBytes, "config")
	if err != nil {
		return configData, types.InstallErrorInvalidManifest, err
	}
	if !types.LocalMapCodePattern.MatchString(configData.Code) {
		return configData, types.InstallErrorInvalidMapCode, fmt.Errorf("invalid map code %q in config.json: must be 2-4 chars, start with 2 uppercase letters, digits only as trailing suffix", configData.Code)
	}

	return configData, "", nil
}

func readInstalledMapConfig(mapInstallRoot string, cityCode string) (types.ConfigData, types.DownloaderErrorType, error) {
	configData := types.ConfigData{}
	plainPath := paths.JoinLocalPath(mapInstallRoot, cityCode, MapConfigFileName)
	file, err := os.Open(plainPath)
	if err != nil {
		return configData, types.InstallErrorInvalidManifest, fmt.Errorf("failed to open installed map config: %w", err)
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return configData, types.InstallErrorInvalidManifest, fmt.Errorf("failed to read installed map config payload: %w", err)
	}
	configData, err = ParseJSON[types.ConfigData](data, "installed map config")
	if err != nil {
		return configData, types.InstallErrorInvalidManifest, fmt.Errorf("failed to parse installed map config: %w", err)
	}
	if !types.LocalMapCodePattern.MatchString(configData.Code) {
		return configData, types.InstallErrorInvalidMapCode, fmt.Errorf("invalid map code %q in installed map config: must be 2-4 chars, start with 2 uppercase letters, digits only as trailing suffix", configData.Code)
	}

	return configData, "", nil
}

// ValidateInstalledMapData validates installed map files under a city-code folder, and parses config.json.
// For downloaded maps (isLocal=false), only the compressed city-data files are required.
func ValidateInstalledMapData(mapInstallRoot string, mapTilesRoot string, cityCode string, isLocal bool) (types.ConfigData, types.DownloaderErrorType, error) {
	if isLocal {
		configPath := paths.JoinLocalPath(mapInstallRoot, cityCode, MapConfigFileName)
		if _, err := os.Stat(configPath); err != nil {
			if errors.Is(err, fs.ErrNotExist) {
				return types.ConfigData{}, types.InstallErrorInvalidArchive, &types.MissingFilesError{Files: []string{fmt.Sprintf("missing installed map file: %s", configPath)}}
			}
			return types.ConfigData{}, types.InstallErrorFilesystem, fmt.Errorf("failed to stat installed map file %q: %w", configPath, err)
		}
	}

	if errorType, err := validateRequiredInstalledMapFiles(mapInstallRoot, mapTilesRoot, cityCode); err != nil {
		return types.ConfigData{}, errorType, err
	}

	return readInstalledMapConfig(mapInstallRoot, cityCode)
}

// mapArchiveFileLabels pairs each archive key with the name shown when missing,
// in a stable display order. Required-ness comes from the index, not this list.
var mapArchiveFileLabels = []struct {
	key   string
	label string
}{
	{MapArchiveKeyConfig, MapConfigFileName},
	{MapArchiveKeyDemandData, MapDemandFileName},
	{MapArchiveKeyRoads, MapRoadsFileName},
	{MapArchiveKeyRunways, MapRunwaysFileName},
	{MapArchiveKeyTiles, "map tiles (*" + MapTileFileExt + ")"},
}

// missingRequiredFiles returns the display names of the absent required files,
// reading required-ness from the index built by BuildMapArchiveFileIndex.
func missingRequiredFiles(filesFound map[string]types.FileFoundStruct) []string {
	missing := make([]string, 0, len(mapArchiveFileLabels))
	for _, f := range mapArchiveFileLabels {
		entry := filesFound[f.key]
		if entry.Required && !entry.Found {
			missing = append(missing, f.label)
		}
	}
	return missing
}

// buildingsIndexPresent reports whether the archive carries a buildings index in either form.
func buildingsIndexPresent(filesFound map[string]types.FileFoundStruct) bool {
	return filesFound[MapArchiveKeyBuildings].Found || filesFound[MapArchiveKeyBuildingsBin].Found
}

func validateRequiredInstalledMapFiles(mapInstallRoot string, mapTilesRoot string, cityCode string) (types.DownloaderErrorType, error) {
	requiredPaths := []string{
		paths.JoinLocalPath(mapInstallRoot, cityCode, MapDemandFileName+".gz"),
		paths.JoinLocalPath(mapInstallRoot, cityCode, MapRoadsFileName+".gz"),
		paths.JoinLocalPath(mapInstallRoot, cityCode, MapRunwaysFileName+".gz"),
		paths.JoinLocalPath(mapTilesRoot, cityCode+MapTileFileExt),
	}

	for _, filePath := range requiredPaths {
		if _, err := os.Stat(filePath); err != nil {
			if errors.Is(err, fs.ErrNotExist) {
				return types.InstallErrorInvalidArchive, &types.MissingFilesError{Files: []string{fmt.Sprintf("missing installed map file: %s", filePath)}}
			}
			return types.InstallErrorFilesystem, fmt.Errorf("failed to stat installed map file %q: %w", filePath, err)
		}
	}

	return installedBuildingsIndexPresent(mapInstallRoot, cityCode)
}

// installedBuildingsIndexPresent verifies at least one installed buildings-index form exists for the city.
func installedBuildingsIndexPresent(mapInstallRoot string, cityCode string) (types.DownloaderErrorType, error) {
	for _, name := range []string{MapBuildingsFileName + ".gz", MapBuildingsBinFileName + ".gz"} {
		exists, err := FileExists(paths.JoinLocalPath(mapInstallRoot, cityCode, name))
		if err != nil {
			return types.InstallErrorFilesystem, fmt.Errorf("failed to stat installed map file %q: %w", name, err)
		}
		if exists {
			return "", nil
		}
	}
	return types.InstallErrorInvalidArchive, &types.MissingFilesError{Files: []string{fmt.Sprintf("missing installed buildings index for %q: need %s or %s", cityCode, MapBuildingsFileName+".gz", MapBuildingsBinFileName+".gz")}}
}
