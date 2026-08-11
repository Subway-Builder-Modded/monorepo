package types

import (
	"encoding/json"
	"sync"
)

// DrivingPathsFile maps a popId to its route as raw JSON bytes. This makes loading
// a map's paths a quick scan and obviates the need to unmarshall the coordinates.
type DrivingPathsFile map[string]json.RawMessage

type DrivingPathsCache struct {
	mu   sync.RWMutex
	data map[string]DrivingPathsFile
	// per-key load locks to prevent duplicate concurrent loads for the same map
	loadLocks map[string]*sync.Mutex
}

type DrivingPathsResponse struct {
	Coordinates [][]float64 `json:"coordinates"`
}

func (c *DrivingPathsCache) AddMap(mapName string, paths DrivingPathsFile) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.data == nil {
		c.data = make(map[string]DrivingPathsFile)
	}
	c.data[mapName] = paths
}

func (c *DrivingPathsCache) RemoveMap(mapName string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.data == nil {
		return
	}
	delete(c.data, mapName)
}

func (c *DrivingPathsCache) GetPath(mapName string, popId string) (json.RawMessage, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if c.data == nil {
		return nil, false
	}
	paths, ok := c.data[mapName]
	if !ok {
		return nil, false
	}
	path, ok := paths[popId]
	if !ok {
		return nil, false
	}
	return path, true
}

// HasMap reports whether the cache contains an entry for mapName.
func (c *DrivingPathsCache) HasMap(mapName string) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if c.data == nil {
		return false
	}
	_, ok := c.data[mapName]
	return ok
}

// LoadIfAbsent runs loader to obtain the map data and stores it under mapName
// only if an entry does not already exist. Concurrent callers for the same
// mapName will serialize so only one loader runs.
func (c *DrivingPathsCache) LoadIfAbsent(mapName string, loader func() (DrivingPathsFile, error)) error {
	// Fast path: check under read lock
	c.mu.RLock()
	if c.data != nil {
		if _, ok := c.data[mapName]; ok {
			c.mu.RUnlock()
			return nil
		}
	}
	c.mu.RUnlock()

	// Ensure there is a per-key mutex for this mapName
	c.mu.Lock()
	if c.loadLocks == nil {
		c.loadLocks = make(map[string]*sync.Mutex)
	}
	l, ok := c.loadLocks[mapName]
	if !ok {
		l = &sync.Mutex{}
		c.loadLocks[mapName] = l
	}
	c.mu.Unlock()

	// Lock the per-key mutex to serialize loaders
	l.Lock()
	defer l.Unlock()

	// Double-check after acquiring per-key lock
	c.mu.RLock()
	if c.data != nil {
		if _, ok := c.data[mapName]; ok {
			c.mu.RUnlock()
			// cleanup the loadLocks entry
			c.mu.Lock()
			delete(c.loadLocks, mapName)
			c.mu.Unlock()
			return nil
		}
	}
	c.mu.RUnlock()

	// Run the loader
	paths, err := loader()
	if err != nil {
		c.mu.Lock()
		delete(c.loadLocks, mapName)
		c.mu.Unlock()
		return err
	}

	// Store the loaded data
	c.mu.Lock()
	if c.data == nil {
		c.data = make(map[string]DrivingPathsFile)
	}
	c.data[mapName] = paths
	delete(c.loadLocks, mapName)
	c.mu.Unlock()

	return nil
}
