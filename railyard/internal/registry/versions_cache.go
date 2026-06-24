package registry

import (
	"net/http"
	"sync"

	"railyard/internal/files"
	"railyard/internal/paths"
	"railyard/internal/types"
)

// This file holds the upstream-release version cache and its HTTP conditional-request (ETag) revalidation.
//
// Rather than re-downloading and re-parsing a release list on every lookup, each entry stores the ETag returned with its versions and replays it as an If-None-Match header on the next fetch.
// Unchanged upstreams answer 304 Not Modified, so we can reuse the cache when that occurs.
//
// Importantly, 304s do not count against the unauthenticated Github API rate limit, in contrast to the
// previous unconditional GET.
//
// Links:
//   - ETag / If-None-Match: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-None-Match
//   - GitHub conditional requests (304s are free): https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api#use-conditional-requests-if-appropriate

// versionCache is the persisted upstream-release version cache + revalidation state for ETags.
type versionCache struct {
	mu          sync.RWMutex
	entries     map[string]types.VersionsCacheEntry // resolved versions + ETags, keyed by "<updateType>|<repoOrURL>"
	revalidated map[string]struct{}                 // keys already revalidated this session, so repeat lookups skip the ETag check
	persist     bool                                // set once loaded from disk; gates writes so caches never loaded (e.g. unit tests) don't touch the user data dir
	logger      logSink
}

// newVersionCache returns an empty, in-memory-only cache. Persistence stays off until
// load() reads the on-disk file.
func newVersionCache(logger logSink) *versionCache {
	return &versionCache{
		entries:     map[string]types.VersionsCacheEntry{},
		revalidated: map[string]struct{}{},
		logger:      logger,
	}
}

// conditionalHeaders augments base with an If-None-Match header when a cached ETag is known for the key
func (c *versionCache) conditionalHeaders(key string, base map[string]string) map[string]string {
	headers := make(map[string]string, len(base)+1)
	for k, v := range base {
		headers[k] = v
	}
	c.mu.RLock()
	entry, ok := c.entries[key]
	c.mu.RUnlock()
	if ok && entry.ETag != "" {
		headers["If-None-Match"] = entry.ETag
	}
	return headers
}

// notModified returns the cached versions when resp is a 304 (Not Modified).
func (c *versionCache) notModified(resp *http.Response, key string) ([]types.VersionInfo, bool) {
	if resp.StatusCode != http.StatusNotModified {
		return nil, false
	}
	resp.Body.Close()
	// A 304 means the cached entry is still current, so tag it as revalidated for this session.
	c.markRevalidated(key)
	cached, _ := c.get(key)
	return cached, true
}

// revalidatedLookup returns the cached versions for a key already validated this
// session, allowing repeat lookups to skip the network entirely.
func (c *versionCache) revalidatedLookup(key string) ([]types.VersionInfo, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if _, ok := c.revalidated[key]; !ok {
		return nil, false
	}
	entry, ok := c.entries[key]
	if !ok {
		return nil, false
	}
	return cloneVersionInfos(entry.Versions), true
}

func (c *versionCache) get(key string) ([]types.VersionInfo, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	entry, ok := c.entries[key]
	if !ok {
		return nil, false
	}
	return cloneVersionInfos(entry.Versions), true
}

// set seeds the in-memory cache (with no ETag) and marks the key revalidated for this
// session. Used by tests to prime the cache directly.
func (c *versionCache) set(key string, versions []types.VersionInfo) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entries[key] = types.VersionsCacheEntry{Versions: cloneVersionInfos(versions)}
	c.revalidated[key] = struct{}{}
}

// store records freshly fetched versions and their ETag for a key, marks the key
// revalidated for this session, and persists the cache to disk.
func (c *versionCache) store(key string, etag string, versions []types.VersionInfo) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entries[key] = types.VersionsCacheEntry{ETag: etag, Versions: cloneVersionInfos(versions)}
	c.revalidated[key] = struct{}{}
	c.persistLocked()
}

func (c *versionCache) markRevalidated(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.revalidated[key] = struct{}{}
}

func (c *versionCache) clear() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entries = map[string]types.VersionsCacheEntry{}
	c.revalidated = map[string]struct{}{}
}

// resetRevalidated drops the revalidation tags while keeping cached versions and ETags.
// The next lookup therefore rechecks upstream releases cheaply via a conditional request,
// rather than re-fetching them in full as clear() would force.
func (c *versionCache) resetRevalidated() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.revalidated = map[string]struct{}{}
}

// load populates the cache from disk and enables persistence. A missing or unreadable
// cache file starts empty rather than failing.
func (c *versionCache) load() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.revalidated = map[string]struct{}{}
	c.persist = true

	file, err := files.ReadJSON[types.VersionsCacheFile](paths.VersionsCachePath(), "versions cache", files.JSONReadOptions{AllowMissing: true, AllowEmpty: true})
	if err != nil {
		c.logger.Warn("Failed to load versions cache; starting empty", "error", err)
		c.entries = map[string]types.VersionsCacheEntry{}
		return
	}
	if file.Entries == nil {
		c.entries = map[string]types.VersionsCacheEntry{}
		return
	}
	c.entries = file.Entries
}

// persistLocked writes the cache to disk best-effort. The caller must hold mu.
func (c *versionCache) persistLocked() {
	if !c.persist {
		return
	}
	file := types.VersionsCacheFile{SchemaVersion: 1, Entries: c.entries}
	if err := files.WriteJSON(paths.VersionsCachePath(), "versions cache", file); err != nil {
		c.logger.Warn("Failed to persist versions cache", "error", err)
	}
}
