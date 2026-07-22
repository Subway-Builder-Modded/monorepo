package constants

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestModTemplateServesModdedDrivingPaths(t *testing.T) {
	cfg := `{"places":[{"code":"KUN"}]}`
	out := ModTemplateWithConfig(cfg)

	// The mod is a single self-contained IIFE (see packages/map-loader).
	require.Contains(t, out, "})();")
	// The driving-path server ships and is wired into the IIFE.
	require.Contains(t, out, "installDrivingPathServer(config)")
	require.Contains(t, out, "__railyardPathShim")
	// It answers the request the pop-details view makes.
	require.Contains(t, out, "map:\\/\\/paths")
	// It is gated to Railyard maps via the config allow-list.
	require.Contains(t, out, "config.places")
	// Config is substituted exactly once, with no placeholder left behind.
	require.Contains(t, out, cfg)
	require.NotContains(t, out, "$CONFIG")

	// The app version is injected from version.txt (MOD_VERSION), with no
	// placeholder left behind, so the shipped mod reports the app's release.
	require.NotContains(t, out, "$MOD_VERSION")
	require.Contains(t, out, `"`+strings.TrimSpace(MOD_VERSION)+`"`)
}
