//go:build windows

package steam

import (
	"context"
	"railyard/internal/paths"

	registry "golang.org/x/sys/windows/registry"
)

func GetSteamLibraryPath(ctx context.Context) (string, error) {
	key, err := registry.OpenKey(registry.CURRENT_USER, `Software\Valve\Steam`, registry.QUERY_VALUE)
	if err != nil {
		return "", err
	}
	defer key.Close()

	path, _, err := key.GetStringValue("SteamPath")

	if err != nil {
		return "", err
	}

	return paths.JoinLocalPath(path, "steamapps"), nil
}
