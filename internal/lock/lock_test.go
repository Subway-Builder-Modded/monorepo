package lock

import (
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestAcquireSecondInstanceReturnsAlreadyRunning(t *testing.T) {
	lockPath := filepath.Join(t.TempDir(), "railyard.lock")

	first, err := Acquire(lockPath)
	require.NoError(t, err)
	require.NotNil(t, first)
	defer func() {
		require.NoError(t, first.Release())
	}()

	second, err := Acquire(lockPath)
	require.ErrorIs(t, err, ErrAlreadyRunning)
	require.Nil(t, second)
}

func TestReleaseThenReacquire(t *testing.T) {
	lockPath := filepath.Join(t.TempDir(), "railyard.lock")

	first, err := Acquire(lockPath)
	require.NoError(t, err)
	require.NotNil(t, first)

	require.NoError(t, first.Release())

	second, err := Acquire(lockPath)
	require.NoError(t, err)
	require.NotNil(t, second)
	defer func() {
		require.NoError(t, second.Release())
	}()
}

func TestReleaseIdempotent(t *testing.T) {
	lockPath := filepath.Join(t.TempDir(), "railyard.lock")

	lock, err := Acquire(lockPath)
	require.NoError(t, err)
	require.NotNil(t, lock)

	require.NoError(t, lock.Release())
	require.NoError(t, lock.Release())
}
