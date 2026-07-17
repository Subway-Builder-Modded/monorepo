package types

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"railyard/internal/constants"
	"railyard/internal/paths"
)

// AppConfig is persisted at ConfigPath() and is used for global configuration
type AppConfig struct {
	RailyardPath            string `json:"railyardPath,omitempty"`
	MetroMakerDataPath      string `json:"metroMakerDataPath,omitempty"`
	ExecutablePath          string `json:"executablePath,omitempty"`
	GithubToken             string `json:"githubToken,omitempty"`
	CheckForUpdatesOnLaunch bool   `json:"checkForUpdatesOnLaunch"`
	SetupCompleted          bool   `json:"setupCompleted"`
	ChromeSandboxPath       string `json:"chromeSandboxPath,omitempty"`
	ViewTestAssets          bool   `json:"viewTestAssets,omitempty"`
	DefaultSteamLibraryPath string `json:"defaultSteamLibraryPath,omitempty"`
	UseSteamLaunch          bool   `json:"useSteamLaunch,omitempty"` // Whether to launch the game through Steam instead of directly.
	SteamGamePath           string `json:"steamGamePath,omitempty"`  // Resolved Steam game install directory; independent of ExecutablePath.
	// Other fields to be appended here
}

// ConfigPathValidation is the result of validating AppConfig paths
type ConfigPathValidation struct {
	IsConfigured            bool `json:"isConfigured"`
	MetroMakerDataPathValid bool `json:"metroMakerDataPathValid"`
	ExecutablePathValid     bool `json:"executablePathValid"`
	SteamGamePathValid      bool `json:"steamGamePathValid"`
	// GameSourceValid reports whether the active launch target is valid.
	GameSourceValid bool `json:"gameSourceValid"`
}

// ResolveConfigResult describes the result of resolving app config from disk.
type ResolveConfigResult struct {
	Config         AppConfig            `json:"config"`
	Validation     ConfigPathValidation `json:"validation"`
	HasGithubToken bool                 `json:"hasGithubToken"`
}

type ResolveConfigResponse struct {
	GenericResponse
	ResolveConfigResult
}

type SetConfigSource string

const (
	SourceAutoDetected   SetConfigSource = "auto_detected"   // For when a path is automatically detected by the app
	SourceDialogSelected SetConfigSource = "dialog_selected" // For when a path is selected by the user through a dialog
	SourceCancelled      SetConfigSource = "cancelled"       // For when user cancels the dialog
)

type SetConfigPathOptions struct {
	AllowAutoDetect bool `json:"allowAutoDetect"`
}

type SetConfigPathResult struct {
	ResolveConfigResult ResolveConfigResult `json:"resolveConfigResult"`
	SetConfigSource     SetConfigSource     `json:"source"`
	AutoDetectedPath    string              `json:"autoDetectedPath,omitempty"`
}

type SetConfigPathResponse struct {
	GenericResponse
	Result SetConfigPathResult `json:"result"`
}

type GithubTokenValidResponse struct {
	GenericResponse
	Valid bool `json:"valid"`
}

// SubscriptionTypeResolver describes how a subscriptions map is linked to a managed directory.
type SubscriptionTypeResolver struct {
	Label          string
	BasePath       string
	ResolveSubPath func(subscriptionID string) (string, bool)
}

func SubscriptionTypeResolvers(
	metroMakerDataPath string,
	mapCodeByID map[string]string,
) map[string]SubscriptionTypeResolver {
	// maps are stored in subdirectories based on their city code
	resolveMapCode := func(subscriptionID string) (string, bool) {
		code, ok := mapCodeByID[subscriptionID]
		if !ok || code == "" {
			return "", false
		}
		return code, true
	}
	// mods are stored within subdirectories with names quivalent to their IDs
	resolveIdentity := func(subscriptionID string) (string, bool) {
		if strings.TrimSpace(subscriptionID) == "" {
			return "", false
		}
		return subscriptionID, true
	}

	return map[string]SubscriptionTypeResolver{
		"maps": {
			Label:          "map",
			BasePath:       paths.MetroMakerMapsDataPath(metroMakerDataPath),
			ResolveSubPath: resolveMapCode,
		},
		"localMaps": {
			Label:          "local map",
			BasePath:       paths.MetroMakerMapsDataPath(metroMakerDataPath),
			ResolveSubPath: resolveMapCode,
		},
		"mods": {
			Label:          "mod",
			BasePath:       paths.MetroMakerModsPath(metroMakerDataPath),
			ResolveSubPath: resolveIdentity,
		},
	}
}

// AreConfigPathsConfigured checks if both required paths have been set in AppConfig.
// The game source path is mode-specific; the Steam game path when launching through
// Steam, the executable path otherwise.
func (c AppConfig) AreConfigPathsConfigured() bool {
	gameSource := c.ExecutablePath
	if c.UseSteamLaunch {
		gameSource = c.SteamGamePath
	}
	return strings.TrimSpace(c.MetroMakerDataPath) != "" && strings.TrimSpace(gameSource) != ""
}

// GetModsFolderPath returns the full path to the mods folder, or an empty string when the
// MetroMaker data folder is not valid. It derives only from MetroMakerDataPath, so it is
// deliberately independent of executable validity — installed files live here regardless of
// whether the game exe is currently launchable.
func (c AppConfig) GetModsFolderPath() string {
	_, validation := c.ValidateConfigPaths()
	if validation.MetroMakerDataPathValid {
		return paths.MetroMakerModsPath(c.MetroMakerDataPath)
	}
	return ""
}

// GetThumbnailFolderPath returns the full path to the thumbnail folder, or an empty string
// when the MetroMaker data folder is not valid. See GetModsFolderPath on exe independence.
func (c AppConfig) GetThumbnailFolderPath() string {
	_, validation := c.ValidateConfigPaths()
	if validation.MetroMakerDataPathValid {
		return paths.JoinLocalPath(c.MetroMakerDataPath, "public", "data", "city-maps")
	}
	return ""
}

// GetMapsFolderPath returns the full path to the maps folder, or an empty string when the
// MetroMaker data folder is not valid. See GetModsFolderPath on exe independence.
func (c AppConfig) GetMapsFolderPath() string {
	_, validation := c.ValidateConfigPaths()
	if validation.MetroMakerDataPathValid {
		return paths.MetroMakerMapsDataPath(c.MetroMakerDataPath)
	}
	return ""
}

// isExecutable is a stricter validation than checking if a particular path is a file
// It checks if the file is a regular file and has executable permissions (or .exe extension on Windows)
func isExecutable(path string, info os.FileInfo) bool {
	// On macOS, .app bundles should be considered executable even though they may be directories
	if runtime.GOOS == "darwin" && info.IsDir() && strings.EqualFold(filepath.Ext(path), ".app") {
		return true
	}
	if info.IsDir() || !info.Mode().IsRegular() {
		return false
	}
	if runtime.GOOS == "windows" {
		return strings.EqualFold(filepath.Ext(path), ".exe")
	}
	// unix: any execute bit set
	return info.Mode()&0o111 != 0
}

// ValidateConfigPaths checks whether the AppConfig has been configured and whether or not its specified paths exist on disk
func (c AppConfig) ValidateConfigPaths() (bool, ConfigPathValidation) {
	result := ConfigPathValidation{
		IsConfigured: c.AreConfigPathsConfigured(),
	}

	if strings.TrimSpace(c.MetroMakerDataPath) != "" {
		modInfo, modErr := os.Stat(c.MetroMakerDataPath)
		result.MetroMakerDataPathValid = modErr == nil && modInfo.IsDir()
	}

	if strings.TrimSpace(c.ExecutablePath) != "" {
		exeInfo, exeErr := os.Stat(c.ExecutablePath)
		result.ExecutablePathValid = exeErr == nil && isExecutable(c.ExecutablePath, exeInfo)
	}

	if strings.TrimSpace(c.SteamGamePath) != "" {
		asarInfo, asarErr := os.Stat(constants.SteamGameAsarPath(c.SteamGamePath))
		result.SteamGamePathValid = asarErr == nil && asarInfo.Mode().IsRegular()
	}

	if c.UseSteamLaunch {
		result.GameSourceValid = result.SteamGamePathValid
	} else {
		result.GameSourceValid = result.ExecutablePathValid
	}

	return result.IsValid(), result
}

func (v ConfigPathValidation) IsValid() bool {
	return v.IsConfigured && v.MetroMakerDataPathValid && v.GameSourceValid
}
