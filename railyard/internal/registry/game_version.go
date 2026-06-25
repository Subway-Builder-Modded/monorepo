package registry

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"sync"

	"railyard/internal/constants"
	"railyard/internal/requests"
	"railyard/internal/types"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// modManifestDeps is the minimal schema needed to extract dependencies from a mod's manifest.json.
type modManifestDeps struct {
	Dependencies map[string]string `json:"dependencies"`
}

// applyIntegrityGameMeta fills GameVersion/Dependencies from the integrity report,
// matched by the github release's repo+tag (the integrity version source carries
// both, so no asset ID is needed). Source-provided values are left untouched.
func (r *Registry) applyIntegrityGameMeta(repo string, versions []types.VersionInfo) {
	repoLower := strings.ToLower(repo)
	byTag := make(map[string]types.IntegrityVersionStatus)
	for _, report := range []types.RegistryIntegrityReport{r.integrityMaps, r.integrityMods} {
		for _, listing := range report.Listings {
			for tag, status := range listing.Versions {
				if status.GameVersion == "" || status.Source.UpdateType != "github" {
					continue
				}
				// Integrity stores lowercased repos; match case-insensitively.
				if strings.ToLower(status.Source.Repo) == repoLower {
					byTag[tag] = status
				}
			}
		}
	}
	if len(byTag) == 0 {
		return
	}
	for i := range versions {
		if versions[i].GameVersion != "" {
			continue
		}
		if status, ok := byTag[versions[i].Version]; ok {
			versions[i].GameVersion = status.GameVersion
			if len(status.Dependencies) > 0 {
				versions[i].Dependencies = status.Dependencies
			}
		}
	}
}

// buildingsIndexConstraintFromMatchedFiles derives the buildings-index semver constraint from an
// integrity version's MatchedFiles map. Registry keys are "buildings_index_json" and
// "buildings_index_bin" — NOT Railyard's internal archive key constants ("buildings"/"buildingsBin").
// JSON null entries unmarshal to "" in map[string]string, so != "" is the correct presence check.
//
// The registry pipeline's withBuildingsIndexPresenceIfMissing backfill rewrites cache entries
// predating the json/bin split: it sets buildings_index_bin:null and promotes the legacy
// buildings_index value to buildings_index_json. "Neither present" therefore means a stale or
// malformed entry, not genuinely unknown. The registry contract is: binary absence == JSON-only
// for all pre-binary releases, so "neither" is treated as JSON-only (<=1.3.0) to match.
func buildingsIndexConstraintFromMatchedFiles(matched map[string]string) string {
	hasBin := matched["buildings_index_bin"] != ""
	hasJSON := matched["buildings_index_json"] != ""
	switch {
	case hasBin && !hasJSON:
		return ">1.3.0"
	case hasBin && hasJSON:
		return "" // both present — compatible with any game version
	default:
		return "<=1.3.0" // JSON only, or neither (registry contract: binary absent = JSON only)
	}
}

// enrichVersions fills GameVersion/dependencies from each version's manifest.json,
// in parallel, as a fallback when the source/integrity did not already provide them.
func (r *Registry) enrichVersions(versions []types.VersionInfo) {
	var wg sync.WaitGroup
	for i := range versions {
		if versions[i].Manifest == "" {
			continue
		}
		// Already supplied by the source (custom JSON) or the integrity report
		// (github) — skip the manifest fetch entirely.
		if versions[i].GameVersion != "" {
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
			// GameVersion is empty here (set ones are skipped above).
			if sbRange, ok := manifest.Dependencies[constants.GameDependencyKey]; ok {
				v.GameVersion = sbRange
			}
			// Keep source-provided dependencies; otherwise take the manifest's.
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
