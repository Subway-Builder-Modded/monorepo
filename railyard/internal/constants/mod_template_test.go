package constants

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestModTemplateServesModdedDrivingPaths(t *testing.T) {
	cfg := `{"places":[{"code":"KUN"}]}`
	out := ModTemplateWithConfig(cfg)

	// The driving-path server ships and is wired into the IIFE.
	require.Contains(t, out, "installDrivingPathServer")
	require.Contains(t, out, "installDrivingPathServer(config);")
	// It answers the request the pop-details view makes.
	require.Contains(t, out, "map:\\/\\/paths")
	// It is gated to Railyard maps via the config allow-list.
	require.Contains(t, out, "config.places")
	// Config is substituted exactly once, with no placeholder left behind.
	require.Contains(t, out, cfg)
	require.NotContains(t, out, "$CONFIG")
}
