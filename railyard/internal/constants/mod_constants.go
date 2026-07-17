package constants

import (
	_ "embed"
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

//go:embed mod_template.js
var modTemplate string

func ModTemplateWithConfig(configJSON string) string {
	return strings.Replace(modTemplate, "$CONFIG", configJSON, 1)
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
