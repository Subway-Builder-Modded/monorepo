package main

import (
	"os"

	"railyard/internal/files"
	"railyard/internal/paths"
	"railyard/internal/types"

	semver "github.com/Masterminds/semver/v3"
)

// binaryBuildingsIndexGameFloor is the game-version boundary for the buildings index
// format: builds strictly newer than this read the packed binary, older builds the
// JSON. Mirrors the registry/jp-data 1.3.0 split.
var binaryBuildingsIndexGameFloor = semver.MustParse("1.3.0")

// gameSupportsBinaryBuildings reports whether the detected game version reads the
// binary buildings index. An undetected version falls back to JSON, which every map
// ships and older builds require.
func gameSupportsBinaryBuildings(gv types.GameVersionResponse) bool {
	version, ok := gv.DetectedVersion()
	return ok && version.GreaterThan(binaryBuildingsIndexGameFloor)
}

// chooseBuildingsIndexStem picks the buildings-index filename stem the game loads for a map.
func chooseBuildingsIndexStem(mapDataRoot string, code string, preferBinary bool) string {
	// Use the binary only when the game supports it and the map actually ships it;
	// otherwise the JSON form. The game API appends .gz to the stem.
	if preferBinary {
		if _, err := os.Stat(paths.JoinLocalPath(mapDataRoot, code, files.MapBuildingsBinFileName+".gz")); err == nil {
			return files.MapBuildingsBinFileName
		}
	}
	return files.MapBuildingsFileName
}
