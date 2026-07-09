package requests

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"railyard/internal/types"
)

type GithubTokenRequestArgs struct {
	URL                    string
	GitHubToken            string
	Context                context.Context
	Headers                map[string]string
	ForceAuthByToken       bool
	ShouldAuthenticateHost func(host string) bool
	OnTokenRejected        func(statusCode int)
}

// Generic client for API requests
func NewAPIClient() *http.Client {
	return &http.Client{Timeout: types.RequestTimeout}
}

// Downloads can be larger and may require retries, so we use a custom client with more lenient timeouts and retry logic.
func NewDownloadClient() *http.Client {
	return &http.Client{
		Transport: &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			DialContext: (&net.Dialer{
				Timeout:   types.RequestTimeout,
				KeepAlive: 30 * time.Second,
			}).DialContext,
			TLSHandshakeTimeout:   types.RequestTimeout,
			ResponseHeaderTimeout: types.RequestTimeout,
			ExpectContinueTimeout: 1 * time.Second,
			IdleConnTimeout:       90 * time.Second,
		},
	}
}

func IsGitHubHost(host string) bool {
	h := strings.ToLower(strings.TrimSpace(host))
	return strings.Contains(h, "github.com") || strings.Contains(h, "githubusercontent.com")
}

func GetWithGithubToken(client *http.Client, opts GithubTokenRequestArgs) (*http.Response, error) {
	shouldAuthenticate := opts.ShouldAuthenticateHost
	if shouldAuthenticate == nil {
		shouldAuthenticate = IsGitHubHost
	}

	buildRequest := func(withToken bool) (*http.Request, error) {
		requestContext := opts.Context
		if requestContext == nil {
			requestContext = context.Background()
		}
		req, err := http.NewRequestWithContext(requestContext, http.MethodGet, opts.URL, nil)
		if err != nil {
			return nil, err
		}

		for key, value := range opts.Headers {
			req.Header.Set(key, value)
		}
		req.Header.Set("User-Agent", types.RequestUserAgent)
		if withToken {
			// Optionally set the Authorization header if the token is present and intended for use
			req.Header.Set("Authorization", "Bearer "+opts.GitHubToken)
		}

		return req, nil
	}

	tokenApplied := false
	if opts.GitHubToken != "" {
		if opts.ForceAuthByToken {
			tokenApplied = true
		} else if parsed, err := url.Parse(opts.URL); err == nil {
			tokenApplied = shouldAuthenticate(parsed.Hostname())
		}
	}

	req, err := buildRequest(tokenApplied)
	if err != nil {
		return nil, err
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	rateLimited := isRateLimited(resp)

	// A 401, or a 403 that is not a rate limit, means the token was rejected (invalid/insufficient
	// scope)
	if tokenApplied && !rateLimited &&
		(resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden) {
		if opts.OnTokenRejected != nil {
			opts.OnTokenRejected(resp.StatusCode)
		}
		resp.Body.Close()

		// Retry once without the token
		reqNoAuth, reqErr := buildRequest(false)
		if reqErr != nil {
			return nil, reqErr
		}
		return client.Do(reqNoAuth)
	}

	if rateLimited {
		if opts.OnTokenRejected != nil {
			// Report as a rate limit (not the raw 403/429) so the surface shows the right message.
			opts.OnTokenRejected(http.StatusTooManyRequests)
		}
		resp.Body.Close()
		return nil, &url.Error{
			Op:  "Get",
			URL: opts.URL,
			Err: fmt.Errorf("rate limited by GitHub API"),
		}
	}

	return resp, nil
}

// isRateLimited reports whether a GitHub response is a rate limit rather than a genuine auth failure.
func isRateLimited(resp *http.Response) bool {
	if resp.StatusCode == http.StatusTooManyRequests {
		return true // 429 is always a rate limit
	}
	// GitHub signals a rate-limit 403 via a Retry-After backoff or an exhausted quota.
	if resp.StatusCode == http.StatusForbidden {
		return resp.Header.Get("Retry-After") != "" || resp.Header.Get("X-RateLimit-Remaining") == "0"
	}
	return false
}
