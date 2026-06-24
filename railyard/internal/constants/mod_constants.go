package constants

import (
	_ "embed"
	"strings"
)

//go:embed version.txt
var MOD_VERSION string

// GameDependencyKey is the manifest dependency key used to declare the required Subway Builder version.
const GameDependencyKey = "subway-builder"

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
