import { describe, expect, it } from 'vitest';

import {
  computeBrowseStatusCounts,
  computeListingStatusCounts,
  listingStatusOf,
  matchesListingStatus,
} from '@/hooks/use-filtered-items';
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

const DEPRECATION = { since: '2026-08-01T00:00:00Z', by_github_id: 1 };
const DELETION = { ...DEPRECATION, deleted: true };

describe('listing status', () => {
  const active = makeMod('a');
  const deprecated = makeMod('b', { deprecation: DEPRECATION });
  const deleted = makeMod('c', { deprecation: DELETION });

  it('classifies each listing into exactly one class', () => {
    expect(listingStatusOf(active)).toBe('active');
    expect(listingStatusOf(deprecated)).toBe('deprecated');
    expect(listingStatusOf(deleted)).toBe('deleted');
  });

  it('matches the selected union', () => {
    expect(matchesListingStatus(active, ['active'])).toBe(true);
    expect(matchesListingStatus(deprecated, ['active'])).toBe(false);
    // Unions are the point of the composable model.
    expect(matchesListingStatus(deprecated, ['active', 'deprecated'])).toBe(
      true,
    );
    expect(matchesListingStatus(deleted, ['deprecated', 'deleted'])).toBe(true);
    expect(matchesListingStatus(active, ['deprecated', 'deleted'])).toBe(false);
  });
});

describe('computeBrowseStatusCounts', () => {
  it('composes test with incompatible within the selected class', () => {
    // The registry's compatibility-test-mod: test + deprecated + every
    // version game-incompatible. In the Deprecated view it must surface
    // BOTH the Test and Incompatible facets.
    const items = [
      makeMod('compat-test-mod', { is_test: true, deprecation: DEPRECATION }),
      makeMod('normal-mod'),
    ];
    const incompatible = new Set([assetKey('mod', 'compat-test-mod')]);

    const activeCounts = computeBrowseStatusCounts(
      items,
      ['active'],
      incompatible,
    );
    expect(activeCounts.compatible).toBe(1); // only normal-mod
    expect(activeCounts.test).toBe(0);
    expect(activeCounts.incompatible).toBe(0);

    const deprecatedCounts = computeBrowseStatusCounts(
      items,
      ['deprecated'],
      incompatible,
    );
    expect(deprecatedCounts.test).toBe(1);
    expect(deprecatedCounts.incompatible).toBe(1);
    expect(deprecatedCounts.compatible).toBe(0);

    // A union counts both classes' members.
    const unionCounts = computeBrowseStatusCounts(
      items,
      ['active', 'deprecated'],
      incompatible,
    );
    expect(unionCounts.test).toBe(1);
    expect(unionCounts.compatible).toBe(1);
  });

  it("counts a deprecated listing's asset statuses normally", () => {
    // Lifecycle is a separate dimension: it no longer zeroes asset status.
    const counts = computeBrowseStatusCounts(
      [makeMod('a', { deprecation: DEPRECATION })],
      ['deprecated'],
      undefined,
    );
    expect(counts.compatible).toBe(1);
  });
});

describe('computeListingStatusCounts', () => {
  it('counts each class for the browsed type only', () => {
    const items: TaggedItem[] = [
      makeMod('a'),
      makeMod('b', { deprecation: DEPRECATION }),
      makeMod('c', { deprecation: DELETION }),
      { type: 'map', item: { id: 'm', deprecation: DELETION } as never },
    ];
    expect(computeListingStatusCounts(items, 'mod')).toEqual({
      active: 1,
      deprecated: 1,
      deleted: 1,
      local: 0,
    });
    expect(computeListingStatusCounts(items, 'map')).toEqual({
      active: 0,
      deprecated: 0,
      deleted: 1,
      local: 0,
    });
  });
});
