import { describe, expect, it } from 'vitest';

import { pollUntilReady } from './polling';

describe('pollUntilReady', () => {
  it('retries until the result is ready', async () => {
    let attempts = 0;

    const result = await pollUntilReady({
      check: async () => {
        attempts += 1;
        return attempts;
      },
      isReady: (value) => value >= 3,
      intervalMs: 0,
    });

    expect(result).toBe(3);
    expect(attempts).toBe(3);
  });

  it('throws when aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      pollUntilReady({
        check: async () => false,
        isReady: Boolean,
        signal: controller.signal,
      }),
    ).rejects.toThrow('Polling aborted');
  });
});