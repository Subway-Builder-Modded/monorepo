import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addLongTaskObserver,
  countRenders,
  mark,
  markFirst,
  measureAsync,
  measureSync,
} from './perf';

const { mockLogFrontend } = vi.hoisted(() => ({
  mockLogFrontend: vi.fn(),
}));

vi.mock('../../wailsjs/go/main/App', () => ({
  LogFrontend: mockLogFrontend,
}));

let consoleSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  consoleSpy.mockRestore();
  vi.useRealTimers();
});

function loggedLines(): string[] {
  return mockLogFrontend.mock.calls.map(([, line]) => String(line));
}

describe('perf logging', () => {
  it('mark logs a labelled timestamp to console and the backend log', () => {
    mark('boot');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(mockLogFrontend).toHaveBeenCalledWith(
      'perf',
      expect.stringMatching(/^\[perf\] boot @ \d+ms$/),
    );
  });

  it('markFirst stamps a name only once', () => {
    markFirst('first-render');
    markFirst('first-render');
    expect(
      loggedLines().filter((line) => line.includes('first-render')),
    ).toHaveLength(1);
  });

  it('measureAsync returns the result and logs the duration', async () => {
    const result = await measureAsync('load', async () => 42);
    expect(result).toBe(42);
    expect(loggedLines().some((line) => /load: [\d.]+ms/.test(line))).toBe(
      true,
    );
  });

  it('measureAsync logs even when the step throws', async () => {
    await expect(
      measureAsync('explode', async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(loggedLines().some((line) => line.includes('explode:'))).toBe(true);
  });

  it('measureSync returns the result and logs the duration', () => {
    expect(measureSync('sort', () => 'sorted')).toBe('sorted');
    expect(loggedLines().some((line) => /sort: [\d.]+ms/.test(line))).toBe(
      true,
    );
  });

  it('countRenders tallies a burst and logs one total after the quiet gap', () => {
    vi.useFakeTimers();
    countRenders('AssetGrid');
    countRenders('AssetGrid');
    countRenders('AssetGrid');
    expect(loggedLines()).toHaveLength(0);

    vi.advanceTimersByTime(250);
    expect(
      loggedLines().filter((line) => line.includes('AssetGrid rendered 3×')),
    ).toHaveLength(1);

    // A later burst starts a fresh tally.
    countRenders('AssetGrid');
    vi.advanceTimersByTime(250);
    expect(
      loggedLines().filter((line) => line.includes('AssetGrid rendered 1×')),
    ).toHaveLength(1);
  });

  it('addLongTaskObserver is a no-op without PerformanceObserver', () => {
    vi.stubGlobal('PerformanceObserver', undefined);
    try {
      expect(() => addLongTaskObserver()).not.toThrow();
      expect(loggedLines()).toHaveLength(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('addLongTaskObserver logs observed long tasks', () => {
    let capturedCallback: ((list: unknown) => void) | undefined;
    class FakeObserver {
      constructor(callback: (list: unknown) => void) {
        capturedCallback = callback;
      }

      observe() {}
    }
    vi.stubGlobal('PerformanceObserver', FakeObserver);
    try {
      addLongTaskObserver();
      capturedCallback?.({
        getEntries: () => [{ duration: 87.4, startTime: 1200.6 }],
      });
      expect(
        loggedLines().some((line) => line.includes('LONG TASK 87ms')),
      ).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
