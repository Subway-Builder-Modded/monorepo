package steam

import (
	"errors"
	"os"
	"railyard/internal/paths"

	vdf "github.com/lewisgibson/go-vdf"
)

// SubwayBuilderAppID is the Steam app id of Subway Builder.
const SubwayBuilderAppID = "4039140"

// subwayBuilderInstallDir is the game's installdir under <library>/steamapps/common.
const subwayBuilderInstallDir = "Subway Builder"

// ErrGameNotInstalled reports that no Steam library contains a Subway Builder install.
var ErrGameNotInstalled = errors.New("Subway Builder is not installed in any Steam library")

// AutodetectSteamSubwayBuilderPath resolves the game's install directory by checking the given
// steamapps directory, then every library listed in its libraryfolders.vdf.
func AutodetectSteamSubwayBuilderPath(steamappsPath string) (string, error) {
	if gamePath, ok := gameDirInSteamapps(steamappsPath); ok {
		return gamePath, nil
	}
	vdfData, err := os.ReadFile(paths.JoinLocalPath(steamappsPath, "libraryfolders.vdf"))
	if err != nil {
		return "", err
	}
	var node vdf.Node
	if err := vdf.Unmarshal(vdfData, &node); err != nil {
		return "", err
	}
	if folders := node.Children["libraryfolders"]; folders != nil {
		for _, library := range folders.Children {
			if library == nil || library.Children["path"] == nil {
				continue
			}
			libSteamapps := paths.JoinLocalPath(library.Children["path"].Value, "steamapps")
			if gamePath, ok := gameDirInSteamapps(libSteamapps); ok {
				return gamePath, nil
			}
		}
	}
	return "", ErrGameNotInstalled
}

// gameDirInSteamapps reports the game directory under one steamapps directory. It requires the
// game's appmanifest rather than the libraryfolders.vdf per-library apps map, which Steam can
// leave stale, and so a leftover common/ directory is not mistaken for an install.
func gameDirInSteamapps(steamappsPath string) (string, bool) {
	if steamappsPath == "" {
		return "", false
	}
	if _, err := os.Stat(paths.JoinLocalPath(steamappsPath, "appmanifest_"+SubwayBuilderAppID+".acf")); err != nil {
		return "", false
	}
	gamePath := paths.JoinLocalPath(steamappsPath, "common", subwayBuilderInstallDir)
	if info, err := os.Stat(gamePath); err != nil || !info.IsDir() {
		return "", false
	}
	return gamePath, true
}
