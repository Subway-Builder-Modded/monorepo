package constants

import (
	_ "embed"
)

//go:embed version.txt
var RAILYARD_VERSION string

const RAILYARD_REPO = "Subway-Builder-Modded/monorepo"

// RailyardAssetMarker marks files/directories managed by Railyard installs.
const RailyardAssetMarker = ".railyard_asset"
const RailyardAssetsSaltedMarker = ".railyard_assets_salted"

const STEAM_URL = "steam://rungameid/4039140"
