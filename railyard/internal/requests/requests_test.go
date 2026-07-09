package requests

import (
	"context"
	"net/http"
	"sync"
	"testing"

	"railyard/internal/testutil"

	"github.com/stretchr/testify/require"
)

func TestIsGitHubHost(t *testing.T) {
	require.True(t, IsGitHubHost("github.com"))
	require.True(t, IsGitHubHost("api.github.com"))
	require.True(t, IsGitHubHost("raw.githubusercontent.com"))
	require.False(t, IsGitHubHost("example.com"))
}

func TestGetWithGithubTokenAppliesHeadersAndToken(t *testing.T) {
	var seenAuth string
	var seenUA string
	var seenCustom string

	server := testutil.NewLocalhostServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seenAuth = r.Header.Get("Authorization")
		seenUA = r.Header.Get("User-Agent")
		seenCustom = r.Header.Get("X-Test")
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	resp, err := GetWithGithubToken(NewAPIClient(), GithubTokenRequestArgs{
		URL:              server.URL,
		GitHubToken:      "token-abc",
		Context:          context.Background(),
		Headers:          map[string]string{"X-Test": "1"},
		ForceAuthByToken: true,
	})
	require.NoError(t, err)
	require.NotNil(t, resp)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)
	require.Equal(t, "Bearer token-abc", seenAuth)
	require.Equal(t, "Railyard-Desktop-App", seenUA)
	require.Equal(t, "1", seenCustom)
}

type stubResponse struct {
	status  int
	headers map[string]string
}

type githubTokenResult struct {
	resp          *http.Response
	err           error
	requestCount  int
	authHeaders   []string
	callbackCodes []int
}

// runGithubTokenRequest serves the given responses in order (repeating the last), calls
// GetWithGithubToken with a forced token, and records the auth header and OnTokenRejected code seen
// on each request so a table can assert on token-fallback vs rate-limit behaviour.
func runGithubTokenRequest(t *testing.T, responses []stubResponse) githubTokenResult {
	t.Helper()
	var mu sync.Mutex
	res := githubTokenResult{}

	server := testutil.NewLocalhostServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		idx := res.requestCount
		res.requestCount++
		res.authHeaders = append(res.authHeaders, r.Header.Get("Authorization"))
		mu.Unlock()

		if idx >= len(responses) {
			idx = len(responses) - 1
		}
		for key, value := range responses[idx].headers {
			w.Header().Set(key, value)
		}
		w.WriteHeader(responses[idx].status)
	}))
	defer server.Close()

	// OnTokenRejected fires synchronously inside GetWithGithubToken, so no lock is needed here.
	res.resp, res.err = GetWithGithubToken(NewAPIClient(), GithubTokenRequestArgs{
		URL:              server.URL,
		GitHubToken:      "token-abc",
		ForceAuthByToken: true,
		OnTokenRejected: func(statusCode int) {
			res.callbackCodes = append(res.callbackCodes, statusCode)
		},
	})
	return res
}

func TestGetWithGithubTokenAuthAndRateLimitHandling(t *testing.T) {
	const bearer = "Bearer token-abc"
	rateLimit403 := func(header, value string) []stubResponse {
		return []stubResponse{{status: http.StatusForbidden, headers: map[string]string{header: value}}}
	}

	cases := []struct {
		name          string
		responses     []stubResponse
		wantErr       bool
		wantStatus    int
		wantRequests  int
		wantAuth      []string
		wantCallbacks []int
	}{
		{
			name:          "401 falls back to an unauthenticated retry",
			responses:     []stubResponse{{status: http.StatusUnauthorized}, {status: http.StatusOK}},
			wantStatus:    http.StatusOK,
			wantRequests:  2,
			wantAuth:      []string{bearer, ""},
			wantCallbacks: []int{http.StatusUnauthorized},
		},
		{
			name:          "genuine 403 falls back to an unauthenticated retry",
			responses:     []stubResponse{{status: http.StatusForbidden}, {status: http.StatusOK}},
			wantStatus:    http.StatusOK,
			wantRequests:  2,
			wantAuth:      []string{bearer, ""},
			wantCallbacks: []int{http.StatusForbidden},
		},
		{
			// A rate-limit 403 must NOT trigger an unauthenticated retry (that silently drops the
			// token) and must surface as a rate limit, not "forbidden".
			name:          "rate-limit 403 via exhausted quota keeps the token",
			responses:     rateLimit403("X-RateLimit-Remaining", "0"),
			wantErr:       true,
			wantRequests:  1,
			wantAuth:      []string{bearer},
			wantCallbacks: []int{http.StatusTooManyRequests},
		},
		{
			name:          "rate-limit 403 via retry-after keeps the token",
			responses:     rateLimit403("Retry-After", "60"),
			wantErr:       true,
			wantRequests:  1,
			wantAuth:      []string{bearer},
			wantCallbacks: []int{http.StatusTooManyRequests},
		},
		{
			name:          "429 surfaces a rate limit and keeps the token",
			responses:     []stubResponse{{status: http.StatusTooManyRequests}},
			wantErr:       true,
			wantRequests:  1,
			wantAuth:      []string{bearer},
			wantCallbacks: []int{http.StatusTooManyRequests},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			res := runGithubTokenRequest(t, tc.responses)
			if tc.wantErr {
				require.Error(t, res.err)
				require.Nil(t, res.resp)
			} else {
				require.NoError(t, res.err)
				require.NotNil(t, res.resp)
				res.resp.Body.Close()
				require.Equal(t, tc.wantStatus, res.resp.StatusCode)
			}
			require.Equal(t, tc.wantRequests, res.requestCount)
			require.Equal(t, tc.wantAuth, res.authHeaders)
			require.Equal(t, tc.wantCallbacks, res.callbackCodes)
		})
	}
}

func TestGetWithGithubTokenSkipsAuthForNonGitHubHostWhenNotForced(t *testing.T) {
	seenAuth := ""
	server := testutil.NewLocalhostServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seenAuth = r.Header.Get("Authorization")
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	resp, err := GetWithGithubToken(NewAPIClient(), GithubTokenRequestArgs{
		URL:         server.URL,
		GitHubToken: "token-abc",
	})
	require.NoError(t, err)
	require.NotNil(t, resp)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)
	require.Empty(t, seenAuth)
}
