package main

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"railyard/internal/config"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func TestSandboxExtractCommand(t *testing.T) {
	cmd := sandboxExtractCommand("/games/subway.AppImage")
	require.Equal(t, []string{"/games/subway.AppImage", "--appimage-extract", "chrome-sandbox"}, cmd.Args)
	require.Equal(t, "/tmp", cmd.Dir)
}

func TestSandboxInstallCommandVariants(t *testing.T) {
	install := []string{"pkexec", "install", "-o", "root", "-g", "root", "-m", "4755", "/tmp/cs", "/usr/local/bin/chrome-sb-sandbox"}

	direct := sandboxInstallCommand(false, "/tmp/cs", "/usr/local/bin/chrome-sb-sandbox")
	require.Equal(t, install, direct.Args)

	// Inside the Flatpak sandbox the install must run on the host.
	viaFlatpak := sandboxInstallCommand(true, "/tmp/cs", "/usr/local/bin/chrome-sb-sandbox")
	require.Equal(t, append([]string{"flatpak-spawn", "--host"}, install...), viaFlatpak.Args)
}

func TestSandboxIsInstalled(t *testing.T) {
	app := newTestApp()
	app.Config = config.NewConfig(app.Logger)

	// Unset path is never installed.
	require.False(t, app.SandboxIsInstalled().Installed)

	sandboxPath := filepath.Join(t.TempDir(), "chrome-sb-sandbox")
	require.NoError(t, os.WriteFile(sandboxPath, []byte("x"), 0o755))
	app.Config.Cfg = types.AppConfig{ChromeSandboxPath: sandboxPath}

	// Only meaningful on Linux; other platforms always report not installed.
	require.Equal(t, runtime.GOOS == "linux", app.SandboxIsInstalled().Installed)
}
