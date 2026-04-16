// @vitest-environment jsdom

import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { usePageWarmup } from './warmup';

describe('usePageWarmup', () => {
  it('runs warmup tasks and calls onReady once', async () => {
    const task = vi.fn().mockResolvedValue(undefined);
    const onReady = vi.fn();

    renderHook(() =>
      usePageWarmup({
        onReady,
        warmupTasks: [task],
        skipRafDelay: true,
      }),
    );

    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('does not run when disabled', () => {
    const task = vi.fn().mockResolvedValue(undefined);
    const onReady = vi.fn();

    renderHook(() =>
      usePageWarmup({
        enabled: false,
        onReady,
        warmupTasks: [task],
      }),
    );

    expect(task).not.toHaveBeenCalled();
    expect(onReady).not.toHaveBeenCalled();
  });

  it('still calls onReady when a warmup task rejects', async () => {
    const onReady = vi.fn();

    renderHook(() =>
      usePageWarmup({
        onReady,
        warmupTasks: [() => Promise.reject(new Error('boom'))],
        skipRafDelay: true,
      }),
    );

    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
  });
});