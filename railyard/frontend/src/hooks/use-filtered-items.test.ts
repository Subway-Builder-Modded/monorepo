import { describe, expect, it } from 'vitest';

import { computeBrowseStatusCounts } from '@/hooks/use-filtered-items';
import { assetKey } from '@/lib/asset-key';
import type { TaggedItem } from '@/lib/tagged-items';

function makeMod(
  id: string,
  overrides: Record<string, unknown> = {},
): TaggedItem {
  return {
    type: 'mod',
    item: {
      id,
      name: id,
      last_updated: 1000,
      ...overrides,
    } as never,
  };
}

describe('computeBrowseStatusCounts', () => {
  it('composes test with incompatible instead of hiding it behind its own facet', () => {
    // A compatibility-test mod whose every version is game-incompatible must
    // surface the Incompatible facet, not just Test.
    const items = [
      makeMod('compat-test-mod', { is_test: true }),
      makeMod('normal-mod'),
    ];
    const incompatible = new Set([assetKey('mod', 'compat-test-mod')]);
    const counts = computeBrowseStatusCounts(items, incompatible);
    expect(counts.test).toBe(1);
    expect(counts.incompatible).toBe(1);
    expect(counts.compatible).toBe(1); // only normal-mod
  });

  it('counts retired items only under their own facet', () => {
    const items = [
      makeMod('old-mod', {
        deprecation: { since: '2026-08-01T00:00:00Z', by_github_id: 1 },
      }),
      makeMod('gone-mod', {
        is_test: true,
        deprecation: {
          since: '2026-08-01T00:00:00Z',
          by_github_id: 1,
          deleted: true,
        },
      }),
    ];
    const incompatible = new Set([assetKey('mod', 'gone-mod')]);
    const counts = computeBrowseStatusCounts(items, incompatible);
    expect(counts.deprecated).toBe(1);
    expect(counts.deleted).toBe(1);
    expect(counts.test).toBe(0);
    expect(counts.incompatible).toBe(0);
    expect(counts.compatible).toBe(0);
  });

  it('flags nothing incompatible without a resolved key set', () => {
    const counts = computeBrowseStatusCounts([makeMod('a')], undefined);
    expect(counts.incompatible).toBe(0);
    expect(counts.compatible).toBe(1);
  });
});
