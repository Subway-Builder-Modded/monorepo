//go:build !windows

package steam

import (
	"context"
	"errors"
	"os"
	"runtime"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

func GetSteamLibraryPath(ctx context.Context) (string, error) {
	switch runtime.GOOS {
	case "darwin":
		if res, err := os.Stat("~/Library/Application Support/Steam/steamapps"); err == nil && res.IsDir() {
			return "~/Library/Application Support/Steam/steamapps", nil
		} else {
			res, err := wailsruntime.OpenDirectoryDialog(ctx, wailsruntime.OpenDialogOptions{
				CanCreateDirectories: false,
				Title:                "Select steamapps Path",
			})
			if err != nil {
				return "", err
			}
			return res, nil
		}
	case "linux":
		if res, err := os.Stat("~/.steam/steam/steamapps"); err == nil && res.IsDir() {
			return "~/.steam/steam/steamapps", nil
		} else if res, err := os.Stat("~/.local/share/Steam/steamapps"); err == nil && res.IsDir() {
			return "~/.local/share/Steam/steamapps", nil
		} else if res, err := os.Stat("~/.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps"); err == nil && res.IsDir() {
			return "~/.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps", nil
		} else if res, err := os.Stat("/var/lib/snapd/snap/steam/common/steamapps"); err == nil && res.IsDir() {
			return "/var/lib/snapd/snap/steam/common/steamapps", nil
		} else {
			res, err := wailsruntime.OpenDirectoryDialog(ctx, wailsruntime.OpenDialogOptions{
				CanCreateDirectories: false,
				Title:                "Select steamapps Path",
			})
			if err != nil {
				return "", err
			}
			return res, nil
		}
	}
	return "", errors.New("Unsupported OS: " + runtime.GOOS)
}
