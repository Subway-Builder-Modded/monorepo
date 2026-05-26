package profiles

import (
	"fmt"
	"strings"
	"sync"

	"railyard/internal/constants"
	"railyard/internal/types"

	semver "github.com/Masterminds/semver/v3"
)

type installableVersionsFunc func(assetID string) ([]types.VersionInfo, error)

// installableVersionsResolver resolves installable versions for profile operations.
func (s *UserProfiles) installableVersionsResolver(assetType types.AssetType) installableVersionsFunc {
	if assetType != types.AssetTypeMap {
		return func(assetID string) ([]types.VersionInfo, error) {
			return s.Registry.GetInstallableVersions(assetType, assetID)
		}
	}

	var (
		once           sync.Once
		currentVersion *semver.Version
		resolveErr     error
	)

	resolveCurrentVersion := func() (*semver.Version, error) {
		once.Do(func() {
			currentVersion, resolveErr = s.resolveCurrentGameVersion()
		})
		return currentVersion, resolveErr
	}

	return func(assetID string) ([]types.VersionInfo, error) {
		versions, err := s.Registry.GetInstallableVersions(assetType, assetID)
		if err != nil {
			return nil, err
		}

		currentVersion, err := resolveCurrentVersion()
		if err != nil {
			return nil, err
		}

		return filterCompatibleMapVersions(versions, currentVersion), nil
	}
}

// resolveCurrentGameVersion loads and parses the current game version for profile compatibility checks.
func (s *UserProfiles) resolveCurrentGameVersion() (*semver.Version, error) {
	if s.Downloader == nil || s.Downloader.GetGameVersion == nil {
		return nil, fmt.Errorf("failed to resolve current game version")
	}

	gameVersionResp := s.Downloader.GetGameVersion()
	if gameVersionResp.Status != types.ResponseSuccess {
		return nil, fmt.Errorf("failed to resolve current game version")
	}

	gameVersion := strings.TrimSpace(gameVersionResp.Version)
	currentVersion, err := semver.NewVersion(strings.TrimPrefix(gameVersion, "v"))
	if err != nil {
		return nil, fmt.Errorf("failed to parse current game version %q: %w", gameVersion, err)
	}

	return currentVersion, nil
}

// filterCompatibleMapVersions keeps only map versions compatible with the current game version.
func filterCompatibleMapVersions(versions []types.VersionInfo, currentVersion *semver.Version) []types.VersionInfo {
	filtered := make([]types.VersionInfo, 0, len(versions))
	for _, version := range versions {
		if isCompatibleMapVersion(currentVersion, version.GameVersion) {
			filtered = append(filtered, version)
		}
	}
	return filtered
}

// isCompatibleMapVersion reports whether a map version is compatible with the current game version.
func isCompatibleMapVersion(currentVersion *semver.Version, requiredRange string) bool {
	requiredRange = strings.TrimSpace(requiredRange)
	if requiredRange == "" {
		return !currentVersion.GreaterThan(semver.MustParse(strings.TrimPrefix(constants.DefaultMapGameVersionConstraint, "<=")))
	}

	constraint, err := semver.NewConstraint(strings.TrimPrefix(requiredRange, "v"))
	if err != nil {
		return false
	}

	return constraint.Check(currentVersion)
}
