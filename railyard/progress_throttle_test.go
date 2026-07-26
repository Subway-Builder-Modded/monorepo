package main

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestProgressThrottleForwardsFirstAndCoalesces(t *testing.T) {
	th := newProgressThrottle()

	// First tick for an item is always forwarded.
	require.True(t, th.allow("map-a", 10, 1000))
	// An immediate follow-up within the interval is dropped.
	require.False(t, th.allow("map-a", 20, 1000))
	require.False(t, th.allow("map-a", 30, 1000))

	// A different item is tracked independently.
	require.True(t, th.allow("map-b", 5, 1000))
}

func TestProgressThrottleAlwaysForwardsTerminalTick(t *testing.T) {
	th := newProgressThrottle()

	require.True(t, th.allow("map-a", 10, 1000))
	require.False(t, th.allow("map-a", 900, 1000)) // coalesced mid-flight
	// The terminal tick bypasses the interval so completion is never dropped.
	require.True(t, th.allow("map-a", 1000, 1000))

	// After a terminal tick the item is forgotten, so a fresh download forwards immediately.
	require.True(t, th.allow("map-a", 1, 1000))
}

func TestProgressThrottleUnknownTotalNeverTreatedAsTerminal(t *testing.T) {
	th := newProgressThrottle()

	// total <= 0 means unknown size; it must not be mistaken for completion.
	require.True(t, th.allow("map-a", 100, -1))
	require.False(t, th.allow("map-a", 200, -1))
	require.False(t, th.allow("map-a", 300, 0))
}
