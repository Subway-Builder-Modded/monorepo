package registry

import (
	"context"
	"fmt"
	"net/http"
	"sync/atomic"
	"testing"

	"railyard/internal/config"
	"railyard/internal/testutil"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func TestFilterSemverVersions(t *testing.T) {
	reg := NewRegistry(testutil.TestLogSink{}, config.NewConfig(testutil.TestLogSink{}))
	filtered := reg.filterSemverVersions([]types.VersionInfo{
		{Version: "1.2.3"},
		{Version: "v2.3.4"},
		{Version: "1.2"},
		{Version: "1.2.3-beta.1"},
		{Version: "1.2.3+build.1"},
		{Version: "not-semver"},
		{Version: ""},
	}, "test")

	require.Len(t, filtered, 2)
	require.Equal(t, "1.2.3", filtered[0].Version)
	require.Equal(t, "v2.3.4", filtered[1].Version)
}

func TestGetGitHubVersionsAuthFallbackAndCache(t *testing.T) {
	cfg := config.NewConfig(testutil.TestLogSink{})
	updated := cfg.UpdateGithubToken("github_pat_test_token")
	require.Equal(t, types.ResponseSuccess, updated.Status)
	reg := NewRegistry(testutil.TestLogSink{}, cfg)
	reg.SetContext(context.WithValue(context.Background(), "test", "true"))

	var requestCount int32
	server := testutil.NewLocalhostServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		current := atomic.AddInt32(&requestCount, 1)
		require.Equal(t, "/repos/owner/repo/releases", r.URL.Path)

		// First authenticated request fails with 401 to trigger fallback.
		if current == 1 {
			require.Equal(t, "Bearer github_pat_test_token", r.Header.Get("Authorization"))
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		require.Empty(t, r.Header.Get("Authorization"))
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `[{"tag_name":"v1.2.3","name":"v1.2.3","body":"notes","prerelease":false,"published_at":"2026-01-01T00:00:00Z","assets":[]}]`)
	}))
	defer server.Close()

	reg.gitHubAPIBaseURL = server.URL
	versions, err := reg.GetVersions("github", "owner/repo")
	require.NoError(t, err)
	require.Len(t, versions, 1)
	require.Equal(t, "v1.2.3", versions[0].Version)
	require.EqualValues(t, 2, atomic.LoadInt32(&requestCount))

	// Second call should be served from in-memory cache.
	versions, err = reg.GetVersions("github", "owner/repo")
	require.NoError(t, err)
	require.Len(t, versions, 1)
	require.EqualValues(t, 2, atomic.LoadInt32(&requestCount))
}

func TestClearVersionsCache(t *testing.T) {
	reg := NewRegistry(testutil.TestLogSink{}, config.NewConfig(testutil.TestLogSink{}))
	reg.versions.set("github|owner/repo", []types.VersionInfo{{Version: "v1.0.0"}})

	_, ok := reg.versions.get("github|owner/repo")
	require.True(t, ok)

	reg.versions.clear()

	_, ok = reg.versions.get("github|owner/repo")
	require.False(t, ok)
}

func TestGetVersionsRevalidatesWithETag(t *testing.T) {
	reg := NewRegistry(testutil.TestLogSink{}, config.NewConfig(testutil.TestLogSink{}))
	reg.SetContext(context.WithValue(context.Background(), "test", "true"))

	var requestCount int32
	server := testutil.NewLocalhostServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&requestCount, 1)
		if r.Header.Get("If-None-Match") == "etag-1" {
			w.WriteHeader(http.StatusNotModified)
			return
		}
		w.Header().Set("ETag", "etag-1")
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `[{"tag_name":"v1.2.3","name":"v1.2.3","prerelease":false,"published_at":"2026-01-01T00:00:00Z","assets":[]}]`)
	}))
	defer server.Close()
	reg.gitHubAPIBaseURL = server.URL

	// First lookup fetches and caches the ETag.
	versions, err := reg.GetVersions("github", "owner/repo")
	require.NoError(t, err)
	require.Len(t, versions, 1)
	require.EqualValues(t, 1, atomic.LoadInt32(&requestCount))

	// Same session: served from memory with no request.
	_, err = reg.GetVersions("github", "owner/repo")
	require.NoError(t, err)
	require.EqualValues(t, 1, atomic.LoadInt32(&requestCount))

	// After a refresh the session marks are cleared but the ETag is kept, so the
	// next lookup revalidates with If-None-Match and reuses cached versions on 304.
	reg.versions.resetRevalidated()
	versions, err = reg.GetVersions("github", "owner/repo")
	require.NoError(t, err)
	require.Len(t, versions, 1)
	require.Equal(t, "v1.2.3", versions[0].Version)
	require.EqualValues(t, 2, atomic.LoadInt32(&requestCount))
}

func TestVersionsCachePersistsAcrossInstances(t *testing.T) {
	testutil.NewHarness(t)

	reg := NewRegistry(testutil.TestLogSink{}, config.NewConfig(testutil.TestLogSink{}))
	reg.versions.load() // enables persistence against the temp data dir
	reg.versions.store("github|owner/repo", "etag-9", []types.VersionInfo{{Version: "v2.0.0"}})

	// A fresh instance loads the persisted entry (versions + ETag) from disk.
	reg2 := NewRegistry(testutil.TestLogSink{}, config.NewConfig(testutil.TestLogSink{}))
	reg2.versions.load()

	cached, ok := reg2.versions.get("github|owner/repo")
	require.True(t, ok)
	require.Len(t, cached, 1)
	require.Equal(t, "v2.0.0", cached[0].Version)

	reg2.versions.mu.RLock()
	defer reg2.versions.mu.RUnlock()
	require.Equal(t, "etag-9", reg2.versions.entries["github|owner/repo"].ETag)
}

// Explicit regression test for Custom JSON versions to ensure that semver sorting is working and that higher semver versions are recorded as "higher" than lower ones, even if they are recorded after in the JSON file.
func TestGetCustomVersionsSortsSemverDescending(t *testing.T) {
	reg := NewRegistry(testutil.TestLogSink{}, config.NewConfig(testutil.TestLogSink{}))

	server := testutil.NewLocalhostServer(t, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{
  "schema_version": 1,
  "versions": [
    {
      "version": "v1.0.0",
      "game_version": "v1.0.0",
      "date": "2026-01-01",
      "changelog": "first",
      "download": "https://example.com/v1.0.0.zip",
      "sha256": "sha-a"
    },
    {
      "version": "v1.0.1",
      "game_version": "v1.0.0",
      "date": "2026-01-02",
      "changelog": "second",
      "download": "https://example.com/v1.0.1.zip",
      "sha256": "sha-b"
    }
  ]
}`)
	}))
	defer server.Close()

	versions, err := reg.GetVersions("custom", server.URL+"/updates.json")
	require.NoError(t, err)
	require.Len(t, versions, 2)
	require.Equal(t, "v1.0.1", versions[0].Version)
	require.Equal(t, "v1.0.0", versions[1].Version)
}

func TestEnrichVersionsPreservesSourceProvidedGameVersionAndDeps(t *testing.T) {
	reg := NewRegistry(testutil.TestLogSink{}, config.NewConfig(testutil.TestLogSink{}))
	reg.SetContext(context.WithValue(context.Background(), "test", "true"))

	server := testutil.NewLocalhostServer(t, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"dependencies":{"subway-builder":"1.0.0","other-mod":"^2.0.0"}}`)
	}))
	defer server.Close()
	manifestURL := server.URL + "/manifest.json"

	versions := []types.VersionInfo{
		// Source (custom JSON) provided a game_version range — must be preserved.
		{Version: "0.3.0", GameVersion: "<=1.3.0", Manifest: manifestURL},
		// Source provided dependencies — must be preserved over the manifest's.
		{Version: "0.2.0", Dependencies: map[string]string{"foo": "1.0.0"}, Manifest: manifestURL},
		// Source provided neither — both filled from the manifest.
		{Version: "0.1.0", Manifest: manifestURL},
	}

	reg.enrichVersions(versions)

	require.Equal(t, "<=1.3.0", versions[0].GameVersion)
	require.Equal(t, map[string]string{"foo": "1.0.0"}, versions[1].Dependencies)
	require.Equal(t, "1.0.0", versions[2].GameVersion)
	require.Equal(t, map[string]string{"other-mod": "^2.0.0"}, versions[2].Dependencies)
}

func TestApplyIntegrityGameMetaFillsGithubVersionsFromIntegrity(t *testing.T) {
	reg := newTestRegistry(t)
	reg.integrityMaps = types.RegistryIntegrityReport{
		Listings: map[string]types.IntegrityListing{
			"map-a": {Versions: map[string]types.IntegrityVersionStatus{
				"v1.2.3": {
					GameVersion:  "<=1.3.0",
					Dependencies: map[string]string{"dep": "^1.0.0"},
					Source:       types.IntegrityVersionSource{UpdateType: "github", Repo: "owner/repo", Tag: "v1.2.3"},
				},
			}},
		},
	}

	versions := []types.VersionInfo{
		{Version: "v1.2.3"},                        // filled from integrity
		{Version: "v9.9.9"},                        // not in integrity -> untouched
		{Version: "v1.0.0", GameVersion: "preset"}, // source-provided -> not overwritten
	}
	// Repo match is case-insensitive (integrity stores lowercased repos).
	reg.applyIntegrityGameMeta("Owner/Repo", versions)

	require.Equal(t, "<=1.3.0", versions[0].GameVersion)
	require.Equal(t, map[string]string{"dep": "^1.0.0"}, versions[0].Dependencies)
	require.Equal(t, "", versions[1].GameVersion)
	require.Equal(t, "preset", versions[2].GameVersion)
}
