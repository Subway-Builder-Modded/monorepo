package constants

import (
	_ "embed"
)

//go:embed version.txt
var RAILYARD_VERSION string

const RAILYARD_REPO = "Subway-Builder-Modded/Railyard"
