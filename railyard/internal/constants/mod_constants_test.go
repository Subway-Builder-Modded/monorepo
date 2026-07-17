package constants

import (
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSteamGameAsarPath(t *testing.T) {
	got := SteamGameAsarPath(filepath.Join("/lib", "common", "Subway Builder"))
	if runtime.GOOS == "darwin" {
		require.True(t, strings.HasSuffix(got, filepath.Join(GameMacAppBundle, "Contents", "Resources", "app.asar")))
	} else {
		require.True(t, strings.HasSuffix(got, filepath.Join("resources", "app.asar")))
	}
	require.True(t, strings.HasPrefix(got, filepath.Join("/lib", "common", "Subway Builder")))
}

func TestModTemplateWithConfig(t *testing.T) {
	rendered := ModTemplateWithConfig(`{"port":1234}`)
	require.Contains(t, rendered, `{"port":1234}`)
	require.NotContains(t, rendered, "$CONFIG")
}
