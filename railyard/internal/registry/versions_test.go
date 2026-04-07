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
	originalBaseURL := registryGitHubAPIBaseURL
	t.Cleanup(func() {
		registryGitHubAPIBaseURL = originalBaseURL
	})

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

	registryGitHubAPIBaseURL = server.URL
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
	reg.setCachedVersions("github|owner/repo", []types.VersionInfo{{Version: "v1.0.0"}})

	_, ok := reg.getCachedVersions("github|owner/repo")
	require.True(t, ok)

	reg.clearVersionsCache()

	_, ok = reg.getCachedVersions("github|owner/repo")
	require.False(t, ok)
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
