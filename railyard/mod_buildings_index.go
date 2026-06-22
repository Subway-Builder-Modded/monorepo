package main

import (
	"os"

	"railyard/internal/files"
	"railyard/internal/paths"
	"railyard/internal/types"

	semver "github.com/Masterminds/semver/v3"
)

// binaryBuildingsIndexGameFloor is the game-version boundary for the buildings index format: builds strictly newer than this read the packed binary, older builds read only the JSON.
var binaryBuildingsIndexGameFloor = semver.MustParse("1.3.0") // Non-inclusive. Binary support was added during the beta cycle following 1.3.0

// preferBinaryBuildingsIndex reports whether the detected game version reads the binary buildings index.
func preferBinaryBuildingsIndex(gv types.GameVersionResponse) bool {
	version, ok := gv.DetectedVersion()
	return ok && version.GreaterThan(binaryBuildingsIndexGameFloor)
}

// setBuildingsIndexStem picks the buildings-index filename stem the game loads for a map.
func setBuildingsIndexStem(mapDataRoot string, code string, preferBinary bool) string {
	// Use the binary only when the game supports it and the map actually ships it; otherwise the JSON form.
	// TODO: Hard fail here if the binary is supported but missing, to avoid loading maps without a valid/compatible buildings index
	if preferBinary {
		if _, err := os.Stat(paths.JoinLocalPath(mapDataRoot, code, files.MapBuildingsBinFileName+".gz")); err == nil {
			return files.MapBuildingsBinFileName
		}
	}
	return files.MapBuildingsFileName
}
