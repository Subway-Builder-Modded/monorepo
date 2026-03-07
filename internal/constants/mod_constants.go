package constants

import (
	_ "embed"
	"strings"
)

const MOD_VERSION = "1.0.0"

//go:embed mod_template.js
var modTemplate string

func ModTemplateWithConfig(configJSON string) string {
	return strings.Replace(modTemplate, "$CONFIG", configJSON, 1)
}
