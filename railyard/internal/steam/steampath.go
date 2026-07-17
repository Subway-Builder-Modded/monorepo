//go:build !windows

package steam

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"runtime"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

func GetSteamLibraryPath(ctx context.Context) (string, error) {
	switch runtime.GOOS {
	case "darwin":
		if home, err := os.UserHomeDir(); err == nil {
			p := filepath.Join(home, "Library", "Application Support", "Steam", "steamapps")
			if res, statErr := os.Stat(p); statErr == nil && res.IsDir() {
				return p, nil
			}
		}
		res, err := wailsruntime.OpenDirectoryDialog(ctx, wailsruntime.OpenDialogOptions{
			CanCreateDirectories: false,
			Title:                "Select steamapps Path",
		})
		if err != nil {
			return "", err
		}
		return res, nil
	case "linux":
		var candidates []string
		if home, err := os.UserHomeDir(); err == nil {
			candidates = append(candidates,
				filepath.Join(home, ".steam", "steam", "steamapps"),
				filepath.Join(home, ".local", "share", "Steam", "steamapps"),
				filepath.Join(home, ".var", "app", "com.valvesoftware.Steam", ".local", "share", "Steam", "steamapps"),
			)
		}
		candidates = append(candidates, "/var/lib/snapd/snap/steam/common/steamapps")
		for _, p := range candidates {
			if p == "" {
				continue
			}
			if res, err := os.Stat(p); err == nil && res.IsDir() {
				return p, nil
			}
		}
		res, err := wailsruntime.OpenDirectoryDialog(ctx, wailsruntime.OpenDialogOptions{
			CanCreateDirectories: false,
			Title:                "Select steamapps Path",
		})
		if err != nil {
			return "", err
		}
		return res, nil
	}
	return "", errors.New("Unsupported OS: " + runtime.GOOS)
}
