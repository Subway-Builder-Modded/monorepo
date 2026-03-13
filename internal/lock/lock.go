package lock

import (
	"errors"
	"fmt"
	"os"
	"sync"

	"railyard/internal/paths"

	"github.com/gofrs/flock"
)

var ErrAlreadyRunning = errors.New("The Railyard application is already running. Only one instance can be open at a time.")

// Handle is a releasable app-level instance lock.
type Handle interface {
	Release() error
}

// Lock is an OS-backed process lock for single-instance enforcement.
type Lock struct {
	lock     *flock.Flock
	mu       sync.Mutex
	released bool
}

// ObtainLock acquires the process-wide app lock used to prevent multiple Railyard instances.
func ObtainLock() (Handle, bool, error) {
	if err := os.MkdirAll(paths.AppDataRoot(), 0o755); err != nil {
		return nil, false, err
	}

	lock, err := Acquire(paths.LockFilePath())
	if err != nil {
		if errors.Is(err, ErrAlreadyRunning) {
			return nil, true, nil
		}
		return nil, false, err
	}

	return lock, false, nil
}

// Acquire attempts to obtain a non-blocking process lock at lockPath.
func Acquire(lockPath string) (*Lock, error) {
	fileLock := flock.New(lockPath)
	locked, err := fileLock.TryLock()
	if err != nil {
		return nil, fmt.Errorf("failed to acquire instance lock: %w", err)
	}
	// If the file is locked, another instance is running and we should throw an error
	if !locked {
		return nil, ErrAlreadyRunning
	}

	return &Lock{lock: fileLock}, nil
}

// Release unlocks the held lock.
func (l *Lock) Release() error {
	if l == nil {
		return nil
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	if l.released {
		return nil
	}

	if err := l.lock.Unlock(); err != nil {
		return fmt.Errorf("failed to release instance lock: %w", err)
	}

	l.released = true
	return nil
}
