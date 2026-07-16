package main

import (
	"testing"
	"time"
)

func TestGameVersionCacheEntryMatches(t *testing.T) {
	base := time.Unix(1_700_000_000, 0)
	entry := gameVersionCacheEntry{
		asarPath: "/game/resources/app.asar",
		mTime:  base,
		size:     1024,
		version:  "1.4.10",
		valid:    true,
	}

	cases := []struct {
		name    string
		path    string
		size    int64
		modTime time.Time
		want    bool
	}{
		{"identical", entry.asarPath, entry.size, base, true},
		{"different mod time (game updated)", entry.asarPath, entry.size, base.Add(time.Second), false},
		{"different size", entry.asarPath, entry.size + 1, base, false},
		{"different path (exe moved)", "/other/resources/app.asar", entry.size, base, false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := entry.matches(tc.path, tc.size, tc.modTime); got != tc.want {
				t.Fatalf("matches(%q, %d, %v) = %v, want %v", tc.path, tc.size, tc.modTime, got, tc.want)
			}
		})
	}
}

func TestGameVersionCacheEntryInvalidNeverMatches(t *testing.T) {
	var zero gameVersionCacheEntry // valid == false
	if zero.matches("/game/resources/app.asar", 1024, time.Unix(1_700_000_000, 0)) {
		t.Fatal("unset cache entry must never report a match")
	}
}
