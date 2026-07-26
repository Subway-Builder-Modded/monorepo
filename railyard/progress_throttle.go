package main

import (
	"sync"
	"time"
)

// progressEmitInterval bounds how often a per-item progress event is forwarded to the frontend.
// download/extract progress fires per read.
// Coalescing to a few ticks per second keeps the progress bar smooth while freeing the main thread.
const progressEmitInterval = 100 * time.Millisecond

// progressThrottle rate-limits progress callbacks per item. The terminal tick (received >= total) is
// always forwarded so completion is never dropped.
type progressThrottle struct {
	mu   sync.Mutex
	last map[string]time.Time
}

func newProgressThrottle() *progressThrottle {
	return &progressThrottle{last: make(map[string]time.Time)}
}

// allow reports whether a progress event for itemId should be forwarded now.
func (t *progressThrottle) allow(itemId string, received, total int64) bool {
	t.mu.Lock()
	defer t.mu.Unlock()

	// Always forward the terminal tick, and forget the item so a later re-download starts fresh.
	if total > 0 && received >= total {
		delete(t.last, itemId)
		return true
	}

	now := time.Now()
	if last, ok := t.last[itemId]; ok && now.Sub(last) < progressEmitInterval {
		return false
	}
	t.last[itemId] = now
	return true
}
