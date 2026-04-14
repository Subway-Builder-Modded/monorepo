import { describe, expect, it } from 'vite-plus/test';

import { getPendingStartupPhases, runStartupPhases } from './startup';

describe('getPendingStartupPhases', () => {
  it('returns only enabled phases that are neither completed nor running', () => {
    const phases = [
      { name: 'one', enabled: true, run: () => {} },
      { name: 'two', enabled: false, run: () => {} },
      { name: 'three', enabled: true, run: () => {} },
    ] as const;

    const pending = getPendingStartupPhases(
      phases,
      new Set(['one']),
      new Set<typeof phases[number]['name']>(['three']),
    );

    expect(pending).toEqual([]);
  });
});

describe('runStartupPhases', () => {
  it('runs phases in order and returns completed names', async () => {
    const events: string[] = [];

    const completed = await runStartupPhases([
      { name: 'one', enabled: true, run: () => events.push('one') },
      { name: 'two', enabled: true, run: async () => events.push('two') },
    ]);

    expect(events).toEqual(['one', 'two']);
    expect(completed).toEqual(['one', 'two']);
  });
});