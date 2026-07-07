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

func TestGetWithGithubTokenFallsBackToUnauthenticatedOn401(t *testing.T) {
	var mu sync.Mutex
	requestCount := 0
	authHeaders := make([]string, 0, 2)
	callbackCodes := make([]int, 0, 1)

	server := testutil.NewLocalhostServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		requestCount++
		authHeaders = append(authHeaders, r.Header.Get("Authorization"))
		index := requestCount
		mu.Unlock()

		if index == 1 {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	resp, err := GetWithGithubToken(NewAPIClient(), GithubTokenRequestArgs{
		URL:              server.URL,
		GitHubToken:      "token-abc",
		ForceAuthByToken: true,
		OnTokenRejected: func(statusCode int) {
			callbackCodes = append(callbackCodes, statusCode)
		},
	})
	require.NoError(t, err)
	require.NotNil(t, resp)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)
	require.Equal(t, []int{http.StatusUnauthorized}, callbackCodes)
	require.Len(t, authHeaders, 2)
	require.Equal(t, "Bearer token-abc", authHeaders[0])
	require.Empty(t, authHeaders[1])
}

func TestGetWithGithubTokenKeepsTokenOnRateLimit403(t *testing.T) {
	for _, tc := range []struct {
		name   string
		header string
		value  string
	}{
		{"exhausted primary quota", "X-RateLimit-Remaining", "0"},
		{"secondary retry-after", "Retry-After", "60"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var mu sync.Mutex
			requestCount := 0
			callbackCodes := make([]int, 0, 1)

			server := testutil.NewLocalhostServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				mu.Lock()
				requestCount++
				mu.Unlock()
				w.Header().Set(tc.header, tc.value)
				w.WriteHeader(http.StatusForbidden)
			}))
			defer server.Close()

			resp, err := GetWithGithubToken(NewAPIClient(), GithubTokenRequestArgs{
				URL:              server.URL,
				GitHubToken:      "token-abc",
				ForceAuthByToken: true,
				OnTokenRejected: func(statusCode int) {
					callbackCodes = append(callbackCodes, statusCode)
				},
			})
			require.Error(t, err)
			require.Nil(t, resp)
			// A rate-limit 403 must NOT trigger an unauthenticated retry (that silently drops the token).
			mu.Lock()
			require.Equal(t, 1, requestCount)
			mu.Unlock()
			// Reported as a rate limit so the surface shows the rate-limit message, not "forbidden".
			require.Equal(t, []int{http.StatusTooManyRequests}, callbackCodes)
		})
	}
}

func TestGetWithGithubTokenRetriesUnauthOnGenuine403(t *testing.T) {
	var mu sync.Mutex
	requestCount := 0
	authHeaders := make([]string, 0, 2)
	callbackCodes := make([]int, 0, 1)

	server := testutil.NewLocalhostServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		requestCount++
		authHeaders = append(authHeaders, r.Header.Get("Authorization"))
		index := requestCount
		mu.Unlock()

		// 403 with no rate-limit headers = genuine permission failure → unauth retry is correct.
		if index == 1 {
			w.WriteHeader(http.StatusForbidden)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	resp, err := GetWithGithubToken(NewAPIClient(), GithubTokenRequestArgs{
		URL:              server.URL,
		GitHubToken:      "token-abc",
		ForceAuthByToken: true,
		OnTokenRejected: func(statusCode int) {
			callbackCodes = append(callbackCodes, statusCode)
		},
	})
	require.NoError(t, err)
	require.NotNil(t, resp)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)
	require.Equal(t, []int{http.StatusForbidden}, callbackCodes)
	require.Len(t, authHeaders, 2)
	require.Equal(t, "Bearer token-abc", authHeaders[0])
	require.Empty(t, authHeaders[1])
}

func TestGetWithGithubTokenRateLimitedOn429(t *testing.T) {
	var mu sync.Mutex
	requestCount := 0
	callbackCodes := make([]int, 0, 1)

	server := testutil.NewLocalhostServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		requestCount++
		mu.Unlock()
		w.WriteHeader(http.StatusTooManyRequests)
	}))
	defer server.Close()

	resp, err := GetWithGithubToken(NewAPIClient(), GithubTokenRequestArgs{
		URL:              server.URL,
		GitHubToken:      "token-abc",
		ForceAuthByToken: true,
		OnTokenRejected: func(statusCode int) {
			callbackCodes = append(callbackCodes, statusCode)
		},
	})
	require.Error(t, err)
	require.Nil(t, resp)
	mu.Lock()
	require.Equal(t, 1, requestCount)
	mu.Unlock()
	require.Equal(t, []int{http.StatusTooManyRequests}, callbackCodes)
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
