package registry

import (
	"testing"

	"railyard/internal/config"
	"railyard/internal/testutil"
)

// newTestRegistry builds a Registry backed by test doubles, shared across the registry tests.
func newTestRegistry(t *testing.T) *Registry {
	t.Helper()
	return NewRegistry(testutil.TestLogSink{}, config.NewConfig(testutil.TestLogSink{}))
}
