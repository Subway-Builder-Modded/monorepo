package registry

import (
	"testing"

	"github.com/stretchr/testify/require"
)

// TestProgressWriterDropsDuplicateFinalTick verifies that git's doubled 100% line
// (bare, then again with ", done.") yields a single terminal emit per stage.
func TestProgressWriterDropsDuplicateFinalTick(t *testing.T) {
	var emitted []RegistryProgress
	pw := newProgressWriter(progressPhaseFetch, func(p RegistryProgress) {
		emitted = append(emitted, p)
	})

	// Git overwrites its progress line in-place with \r and terminates the stage with a
	// bare 100% tick followed by an identical "..., done." line.
	_, err := pw.Write([]byte(
		"Counting objects:  50% (1127/2253)\r" +
			"Counting objects: 100% (2253/2253)\r" +
			"Counting objects: 100% (2253/2253), done.\n",
	))
	require.NoError(t, err)

	finals := 0
	for _, p := range emitted {
		if p.Stage == progressStageCounting && p.Percent >= 100 {
			finals++
		}
	}
	require.Equal(t, 1, finals, "the duplicate 100%% counting tick should be dropped")
}
