package deeplink

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestParseURL(t *testing.T) {
	cases := []struct {
		name   string
		raw    string
		target Target
		ok     bool
	}{
		{"mod open by host", "railyard://open?type=mods&id=test-mod", Target{Type: "mods", ID: "test-mod"}, true},
		{"map open by path", "railyard:///open?type=maps&id=ukb", Target{Type: "maps", ID: "ukb"}, true},
		{"case-insensitive scheme and type", "RAILYARD://open?type=MODS&id=x", Target{Type: "mods", ID: "x"}, true},
		{"surrounding whitespace", "  railyard://open?type=mods&id=x  ", Target{Type: "mods", ID: "x"}, true},
		{"game start", "railyard://start-game", Target{Type: "GameStart"}, true},
		{"game start by path", "railyard:///start-game/", Target{Type: "GameStart"}, true},
		{"wrong scheme", "https://open?type=mods&id=x", Target{}, false},
		{"unknown action", "railyard://install?type=mods&id=x", Target{}, false},
		{"unknown type", "railyard://open?type=profiles&id=x", Target{}, false},
		{"missing id", "railyard://open?type=mods", Target{}, false},
		{"unparseable url", "railyard://open?type=mods&id=%zz\x7f", Target{}, false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			target, ok := ParseURL(tc.raw)
			require.Equal(t, tc.ok, ok)
			require.Equal(t, tc.target, target)
		})
	}
}

func TestParseArgs(t *testing.T) {
	target, ok := ParseArgs([]string{"--flag", "not-a-url", "railyard://open?type=maps&id=ukb"})
	require.True(t, ok)
	require.Equal(t, Target{Type: "maps", ID: "ukb"}, target)

	_, ok = ParseArgs([]string{"--flag", "not-a-url"})
	require.False(t, ok)

	_, ok = ParseArgs(nil)
	require.False(t, ok)
}

func TestTargetValid(t *testing.T) {
	require.True(t, Target{Type: "GameStart"}.Valid())
	require.True(t, Target{Type: "mods", ID: "x"}.Valid())
	require.False(t, Target{Type: "mods"}.Valid())
	require.False(t, Target{Type: "other", ID: "x"}.Valid())
}
