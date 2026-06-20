package registry

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"sort"
	"strings"
	"sync"

	"railyard/internal/constants"
	"railyard/internal/requests"
	"railyard/internal/types"

	semver "github.com/Masterminds/semver/v3"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// modManifestDeps is the minimal schema needed to extract dependencies from a mod's manifest.json.
type modManifestDeps struct {
	Dependencies map[string]string `json:"dependencies"`
}

// GetVersions fetches available versions for a mod or map.
// updateType must be "github" or "custom".
// repoOrURL is "owner/repo" for github, or a URL for custom.
func (r *Registry) GetVersions(updateType string, repoOrURL string) ([]types.VersionInfo, error) {
	cacheKey := updateType + "|" + repoOrURL

	// Fast path: a key already revalidated this session needs no request at all.
	if cached, ok := r.versions.revalidatedLookup(cacheKey); ok {
		return cached, nil
	}

	// Otherwise issue a conditional fetch; the ETag carried on the persisted entry lets
	// the helper short-circuit on a 304 instead of re-downloading the release list.
	switch updateType {
	case "github":
		return r.getGitHubVersions(cacheKey, repoOrURL)
	case "custom":
		return r.getCustomVersions(cacheKey, repoOrURL)
	default:
		return nil, fmt.Errorf("unsupported update type: %q", updateType)
	}
}

// GetVersionsResponse fetches available versions and reports status metadata.
func (r *Registry) GetVersionsResponse(updateType string, repoOrURL string) types.VersionsResponse {
	versions, err := r.GetVersions(updateType, repoOrURL)
	if err != nil {
		return types.VersionsResponse{
			GenericResponse: types.ErrorResponse(err.Error()),
			Versions:        []types.VersionInfo{},
		}
	}

	return types.VersionsResponse{
		GenericResponse: types.SuccessResponse("Versions loaded"),
		Versions:        versions,
	}
}

func (r *Registry) getGitHubVersions(cacheKey string, repo string) ([]types.VersionInfo, error) {
	parts := strings.SplitN(repo, "/", 2)
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return nil, fmt.Errorf("invalid GitHub repo format %q: expected \"owner/repo\"", repo)
	}

	baseURL := strings.TrimRight(r.githubAPIBase(), "/")
	apiURL := fmt.Sprintf("%s/repos/%s/releases", baseURL, repo)

	resp, err := requests.GetWithGithubToken(r.httpClient, requests.GithubTokenRequestArgs{
		URL:              apiURL,
		GitHubToken:      r.config.GetGithubToken(),
		ForceAuthByToken: true,
		Headers:          r.versions.conditionalHeaders(cacheKey, map[string]string{"Accept": "application/vnd.github+json"}),
		OnTokenRejected: func(statusCode int) {
			r.logger.Warn("GitHub token rejected; retrying unauthenticated request", "repo", repo, "status", statusCode)
			requestErrType := types.GetErrorTypeForStatus(statusCode)
			if r.context.Value("test") != "true" {
				wailsruntime.EventsEmit(r.context, "requests:request-error", requestErrType)
			}
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch GitHub releases for %q: %w", repo, err)
	}

	// The releases are unchanged since the cached ETag, so reuse the cached versions.
	if cached, ok := r.versions.notModified(resp, cacheKey); ok {
		return cached, nil
	}

	if resp.StatusCode != http.StatusOK {
		status := resp.StatusCode
		resp.Body.Close()
		return nil, fmt.Errorf("GitHub API returned status %d for %q", status, repo)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 5*1024*1024))
	if err != nil {
		return nil, fmt.Errorf("failed to read GitHub API response: %w", err)
	}

	var releases []types.GithubRelease
	if err := json.Unmarshal(body, &releases); err != nil {
		return nil, fmt.Errorf("failed to parse GitHub releases JSON: %w", err)
	}

	versions := make([]types.VersionInfo, 0, len(releases))
	for _, rel := range releases {
		v := types.VersionInfo{
			Version:    rel.TagName,
			Name:       rel.Name,
			Changelog:  rel.Body,
			Date:       rel.PublishedAt,
			Prerelease: rel.Prerelease,
		}
		for _, asset := range rel.Assets {
			v.Downloads += asset.DownloadCount
			if asset.Name == constants.MANIFEST_JSON {
				v.Manifest = asset.BrowserDownloadURL
			}
			if v.DownloadURL == "" && path.Ext(asset.Name) == ".zip" {
				v.DownloadURL = asset.BrowserDownloadURL
			}
		}
		versions = append(versions, v)
	}

	versions = r.filterSemverVersions(versions, "github:"+repo)
	// Fetch manifest.json assets in parallel to extract game_version
	r.enrichVersions(versions)

	r.versions.store(cacheKey, resp.Header.Get("ETag"), versions)
	return cloneVersionInfos(versions), nil
}

// enrichVersions fetches manifest.json URLs in parallel and fills in GameVersion
// and dependencies from the game dependency key in the manifest. Values already
// supplied by the version source (e.g. a custom update JSON's game_version,
// which may be an author-authored range like "<=1.3.0") take precedence and are
// never overwritten by the manifest. Errors are silently ignored per-version.
func (r *Registry) enrichVersions(versions []types.VersionInfo) {
	var wg sync.WaitGroup
	for i := range versions {
		if versions[i].Manifest == "" {
			continue
		}
		wg.Add(1)
		go func(v *types.VersionInfo) {
			defer wg.Done()
			resp, err := requests.GetWithGithubToken(r.httpClient, requests.GithubTokenRequestArgs{
				URL: v.Manifest,
				Headers: map[string]string{
					"Accept": "application/octet-stream",
				},
				OnTokenRejected: func(statusCode int) {
					r.logger.Warn("GitHub token rejected; retrying unauthenticated request", "status", statusCode)
					requestErrType := types.GetErrorTypeForStatus(statusCode)
					if r.context.Value("test") != "true" {
						wailsruntime.EventsEmit(r.context, "requests:request-error", requestErrType)
					}
				},
			})
			if err != nil {
				return
			}
			defer resp.Body.Close()
			if resp.StatusCode != http.StatusOK {
				return
			}
			body, err := io.ReadAll(io.LimitReader(resp.Body, 256*1024))
			if err != nil {
				return
			}
			var manifest modManifestDeps
			if err := json.Unmarshal(body, &manifest); err != nil {
				return
			}
			// Only fill GameVersion from the manifest when the source did not
			// already provide it, so a custom JSON's game_version wins.
			if v.GameVersion == "" {
				if sbRange, ok := manifest.Dependencies[constants.GameDependencyKey]; ok {
					v.GameVersion = sbRange
				}
			}
			// Likewise, keep source-provided dependencies over the manifest's.
			if len(v.Dependencies) == 0 {
				newDeps := make(map[string]string)
				for depID, depRange := range manifest.Dependencies {
					if depID == constants.GameDependencyKey {
						continue
					}
					newDeps[depID] = depRange
				}
				if len(newDeps) > 0 {
					v.Dependencies = newDeps
				}
			}
		}(&versions[i])
	}
	wg.Wait()
}

func (r *Registry) getCustomVersions(cacheKey string, updateURL string) ([]types.VersionInfo, error) {
	parsed, err := url.Parse(updateURL)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return nil, fmt.Errorf("invalid custom update URL %q: must be http or https", updateURL)
	}

	resp, err := requests.GetWithGithubToken(r.httpClient, requests.GithubTokenRequestArgs{
		URL:     updateURL,
		Headers: r.versions.conditionalHeaders(cacheKey, nil),
		OnTokenRejected: func(statusCode int) {
			r.logger.Warn("GitHub token rejected on custom update URL; retrying unauthenticated request", "url", updateURL, "status", statusCode)
			requestErrType := types.GetErrorTypeForStatus(statusCode)
			if r.context.Value("test") != "true" {
				wailsruntime.EventsEmit(r.context, "requests:request-error", requestErrType)
			}
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch custom update from %q: %w", updateURL, err)
	}

	// Custom URLs that support conditional requests (e.g. raw.githubusercontent.com) answer 304 when unchanged.
	if cached, ok := r.versions.notModified(resp, cacheKey); ok {
		return cached, nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("custom update URL returned status %d for %q", resp.StatusCode, updateURL)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 2*1024*1024))
	if err != nil {
		return nil, fmt.Errorf("failed to read custom update response: %w", err)
	}

	var updateFile types.CustomUpdateFile
	if err := json.Unmarshal(body, &updateFile); err != nil {
		return nil, fmt.Errorf("failed to parse custom update JSON: %w", err)
	}

	versions := make([]types.VersionInfo, 0, len(updateFile.Versions))
	for _, v := range updateFile.Versions {
		versions = append(versions, types.VersionInfo{
			Version:      v.Version,
			Name:         v.Version,
			Changelog:    v.Changelog,
			Date:         v.Date,
			DownloadURL:  v.Download,
			GameVersion:  v.GameVersion,
			SHA256:       v.SHA256,
			Manifest:     v.Manifest,
			Dependencies: v.Dependencies,
		})
	}

	r.enrichVersions(versions)
	filtered := r.filterSemverVersions(versions, "custom:"+updateURL)
	sortSemverVersions(filtered)

	r.versions.store(cacheKey, resp.Header.Get("ETag"), filtered)
	return cloneVersionInfos(filtered), nil
}

func (r *Registry) filterSemverVersions(
	versions []types.VersionInfo,
	sourceLabel string,
) []types.VersionInfo {
	filtered := make([]types.VersionInfo, 0, len(versions))
	for _, version := range versions {
		if !types.IsValidSemverVersion(types.Version(version.Version)) {
			r.logger.Warn("Skipping non-semver version", "version", version.Version, "source", sourceLabel)
			continue
		}
		filtered = append(filtered, version)
	}
	return filtered
}

func cloneVersionInfos(input []types.VersionInfo) []types.VersionInfo {
	output := make([]types.VersionInfo, len(input))
	copy(output, input)
	return output
}

// sortSemverVersions sorts versions in-place by descending semantic version, with non-semver versions at the end sorted by descending string order.
func sortSemverVersions(versions []types.VersionInfo) {
	sort.SliceStable(versions, func(i, j int) bool {
		leftVersion := strings.TrimPrefix(types.NormalizeSemver(versions[i].Version), "v")
		rightVersion := strings.TrimPrefix(types.NormalizeSemver(versions[j].Version), "v")
		left, _ := semver.NewVersion(leftVersion)
		right, _ := semver.NewVersion(rightVersion)
		return left.GreaterThan(right)
	})
}
