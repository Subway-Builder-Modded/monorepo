package constants

import (
	_ "embed"
	"path/filepath"
	"runtime"
	"strings"
)

//go:embed version.txt
var MOD_VERSION string

// GameDependencyKey is the manifest dependency key used to declare the required Subway Builder version.
const GameDependencyKey = "subway-builder"

// GameMacAppBundle is the name of the game's macOS .app bundle directory.
const GameMacAppBundle = "Subway Builder.app"

// GameMacProcessName is the process name of the game binary inside the macOS .app bundle.
const GameMacProcessName = "Subway Builder"

// GameAsarMacRelPath is the path to app.asar relative to the macOS .app bundle root.
const GameAsarMacRelPath = "Contents/Resources/app.asar"

// GameAsarRelPath is the path to app.asar relative to the game executable on Windows and Linux.
const GameAsarRelPath = "resources/app.asar"

// SteamGameAsarPath returns the app.asar location inside a Steam game install directory,
// which nests inside the .app bundle on macOS.
func SteamGameAsarPath(gamePath string) string {
	if runtime.GOOS == "darwin" {
		return filepath.Join(gamePath, GameMacAppBundle, GameAsarMacRelPath)
	}
	return filepath.Join(gamePath, GameAsarRelPath)
}

// mod_template.js is generated: it is the esbuild IIFE bundle of the
// packages/map-loader workspace package. DO NOT edit it by hand
// CI enforces that the committed bundle matches source.
//
//go:generate pnpm --filter @subway-builder-modded/map-loader build
//go:embed mod_template.js
var modTemplate string

func ModTemplateWithConfig(configJSON string) string {
	out := strings.Replace(modTemplate, "$CONFIG", configJSON, 1)
	out = strings.Replace(out, "$MOD_VERSION", strings.TrimSpace(MOD_VERSION), 1)
	return out
}

var MAP_COLORS = map[string]map[string]string{
	"LIGHT": {
		"AIRPORT": "#f0f1f5",
		"PARK":    "#A9D8B6",
	},
	"DARK": {
		"AIRPORT": "#181c28",
		"PARK":    "#0b1715",
	},
}
