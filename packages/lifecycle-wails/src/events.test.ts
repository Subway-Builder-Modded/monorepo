import { describe, expect, it, vi } from 'vitest';

import { subscribeToWailsEvents } from './events';

describe('subscribeToWailsEvents', () => {
  it('subscribes to all events and cleans them up', () => {
    const cleanupA = vi.fn();
    const cleanupB = vi.fn();
    const subscribe = vi
      .fn()
      .mockReturnValueOnce(cleanupA)
      .mockReturnValueOnce(cleanupB);

    const unsubscribe = subscribeToWailsEvents(subscribe, [
      { eventName: 'one', handler: vi.fn() },
      { eventName: 'two', handler: vi.fn() },
    ]);

    expect(subscribe).toHaveBeenCalledTimes(2);

    unsubscribe();

    expect(cleanupA).toHaveBeenCalledTimes(1);
    expect(cleanupB).toHaveBeenCalledTimes(1);
  });
});