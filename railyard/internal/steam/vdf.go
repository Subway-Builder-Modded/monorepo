package steam

import (
	"os"
	"railyard/internal/paths"

	vdf "github.com/lewisgibson/go-vdf"
)

func AutodetectSteamSubwayBuilderPath(steamappsPath string) (string, error) {
	vdfPath := paths.JoinLocalPath(steamappsPath, "libraryfolders.vdf")
	var node vdf.Node
	vdfData, err := os.ReadFile(vdfPath)
	if err != nil {
		return "", err
	}
	if err := vdf.Unmarshal(vdfData, &node); err != nil {
		return "", err
	}
	for _, library := range node.Children["libraryfolders"].Children {
		apps := library.Children["apps"]
		for key := range apps.Children {
			if key == "4039140" {
				return paths.JoinLocalPath(library.Children["path"].Value, "steamapps", "common", "Subway Builder"), nil
			}
		}
	}
	return "", nil
}
