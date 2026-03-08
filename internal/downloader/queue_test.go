package downloader

import (
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func TestEnqueueOperationDeduplicatesByKey(t *testing.T) {
	d := &Downloader{}
	const requestKey = "install|map|map-a|1.0.0"
	const callers = 6

	var runCount int32
	results := make([]operationResult, callers)
	var wg sync.WaitGroup

	for i := 0; i < callers; i++ {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()
			results[index] = d.enqueueOperation(requestKey, func() operationResult {
				atomic.AddInt32(&runCount, 1)
				time.Sleep(30 * time.Millisecond)
				return operationResult{
					genericResponse: types.GenericResponse{
						Status:  types.ResponseSuccess,
						Message: "ok",
					},
				}
			})
		}(i)
	}

	wg.Wait()
	require.Equal(t, int32(1), atomic.LoadInt32(&runCount))
	for _, result := range results {
		require.Equal(t, types.ResponseSuccess, result.genericResponse.Status)
		require.Equal(t, "ok", result.genericResponse.Message)
	}
}

func TestEnqueueOperationRunsSequentially(t *testing.T) {
	d := &Downloader{}
	const jobs = 5

	var runCount int32
	var activeCount int32
	var maxConcurrent int32

	recordMax := func(current int32) {
		for {
			existing := atomic.LoadInt32(&maxConcurrent)
			if current <= existing {
				return
			}
			if atomic.CompareAndSwapInt32(&maxConcurrent, existing, current) {
				return
			}
		}
	}

	var wg sync.WaitGroup
	for i := 0; i < jobs; i++ {
		key := fmt.Sprintf("install|mod|mod-%d|1.0.0", i)
		wg.Add(1)
		go func(requestKey string) {
			defer wg.Done()
			_ = d.enqueueOperation(requestKey, func() operationResult {
				atomic.AddInt32(&runCount, 1)
				current := atomic.AddInt32(&activeCount, 1)
				recordMax(current)
				time.Sleep(20 * time.Millisecond)
				atomic.AddInt32(&activeCount, -1)
				return operationResult{
					genericResponse: types.GenericResponse{
						Status:  types.ResponseSuccess,
						Message: "done",
					},
				}
			})
		}(key)
	}

	wg.Wait()
	require.Equal(t, int32(jobs), atomic.LoadInt32(&runCount))
	require.Equal(t, int32(1), atomic.LoadInt32(&maxConcurrent))
}
