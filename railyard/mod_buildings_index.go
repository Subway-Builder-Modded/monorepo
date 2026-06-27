package main

import (
	"fmt"
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

// setBuildingsIndexStem picks the buildings-index filename stem for a map, or returns
// an error if the installed files are incompatible with the detected game version.
func setBuildingsIndexStem(mapDataRoot string, code string, preferBinary bool) (string, error) {
	hasBin := func() bool {
		_, err := os.Stat(paths.JoinLocalPath(mapDataRoot, code, files.MapBuildingsBinFileName+".gz"))
		return err == nil
	}()
	hasJSON := func() bool {
		_, err := os.Stat(paths.JoinLocalPath(mapDataRoot, code, files.MapBuildingsFileName+".gz"))
		return err == nil
	}()

	if preferBinary {
		if hasBin {
			return files.MapBuildingsBinFileName, nil
		}
		return "", fmt.Errorf("map %q: game requires binary buildings index (>1.3.0) but only JSON is installed", code)
	}
	if hasJSON {
		return files.MapBuildingsFileName, nil
	}
	return "", fmt.Errorf("map %q: game requires JSON buildings index (<=1.3.0) but only binary is installed", code)
}
