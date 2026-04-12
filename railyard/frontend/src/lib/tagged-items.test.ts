import { sortTaggedItemsByLastUpdated } from '@subway-builder-modded/asset-listings-ui';
import { describe, expect, it } from 'vitest';

import {
  buildTaggedItems,
  compareItems,
  type TaggedItem,
} from './tagged-items';

// Minimal fixture helpers — use plain objects since tagged-items only uses
// `import type` for the wailsjs models, so no class instantiation needed at runtime.
function makeMod(overrides: Record<string, unknown> = {}): TaggedItem {
  return {
    type: 'mod',
    item: {
      id: 'mod-1',
      name: 'Test Mod',
      author: {
        author_id: 'author',
        author_alias: 'Author',
        attribution_link: 'https://example.com/author',
      },
      last_updated: 1000,
      ...overrides,
    } as never,
  };
}

function makeMap(overrides: Record<string, unknown> = {}): TaggedItem {
  return {
    type: 'map',
    item: {
      id: 'map-1',
      name: 'Test Map',
      author: {
        author_id: 'author',
        author_alias: 'Author',
        attribution_link: 'https://example.com/author',
      },
      last_updated: 2000,
      city_code: 'TST',
      country: 'testland',
      population: 100_000,
      ...overrides,
    } as never,
  };
}

describe('buildTaggedItems', () => {
  it('combines mods and maps into a flat tagged list', () => {
    const items = buildTaggedItems(
      [{ id: 'mod-1' } as never],
      [{ id: 'map-1' } as never],
    );
    expect(items).toHaveLength(2);
    expect(items[0].type).toBe('mod');
    expect(items[1].type).toBe('map');
  });

  it('returns empty array when both lists are empty', () => {
    expect(buildTaggedItems([], [])).toHaveLength(0);
  });
});

describe('compareItems', () => {
  it('sorts by name alphabetically', () => {
    const a = makeMod({ name: 'Alpha' });
    const b = makeMod({ name: 'Zebra' });
    expect(
      compareItems(a, b, { field: 'name', direction: 'asc' }, {}, {}),
    ).toBeLessThan(0);
    expect(
      compareItems(a, b, { field: 'name', direction: 'desc' }, {}, {}),
    ).toBeGreaterThan(0);
  });

  it('sorts by author alphabetically', () => {
    const a = makeMod({
      author: {
        author_id: 'alice',
        author_alias: 'Alice',
        attribution_link: 'https://example.com/alice',
      },
    });
    const b = makeMod({
      author: {
        author_id: 'zara',
        author_alias: 'Zara',
        attribution_link: 'https://example.com/zara',
      },
    });
    expect(
      compareItems(a, b, { field: 'author', direction: 'asc' }, {}, {}),
    ).toBeLessThan(0);
  });

  it('sorts by downloads using totals lookup', () => {
    const a = makeMod({ id: 'mod-a' });
    const b = makeMod({ id: 'mod-b' });
    const result = compareItems(
      a,
      b,
      { field: 'downloads', direction: 'desc' },
      { 'mod-a': 100, 'mod-b': 50 },
      {},
    );
    expect(result).toBeLessThan(0); // a has more downloads, comes first descending
  });

  it('sorts by last_updated', () => {
    const older = makeMod({ last_updated: 100 });
    const newer = makeMod({ last_updated: 999 });
    expect(
      compareItems(
        older,
        newer,
        { field: 'last_updated', direction: 'desc' },
        {},
        {},
      ),
    ).toBeGreaterThan(0); // newer should come first
  });

  it('sorts maps by population', () => {
    const small = makeMap({ population: 10_000 });
    const large = makeMap({ population: 1_000_000 });
    expect(
      compareItems(
        small,
        large,
        { field: 'population', direction: 'desc' },
        {},
        {},
      ),
    ).toBeGreaterThan(0);
  });

  it('sorts maps by city_code', () => {
    const a = makeMap({ city_code: 'AAA' });
    const b = makeMap({ city_code: 'ZZZ' });
    expect(
      compareItems(a, b, { field: 'city_code', direction: 'asc' }, {}, {}),
    ).toBeLessThan(0);
  });

  it('sorts maps by country', () => {
    const a = makeMap({ country: 'austria' });
    const b = makeMap({ country: 'zimbabwe' });
    expect(
      compareItems(a, b, { field: 'country', direction: 'asc' }, {}, {}),
    ).toBeLessThan(0);
  });
});

describe('sortTaggedItemsByLastUpdated', () => {
  it('sorts descending by default', () => {
    const items = [
      makeMod({ id: 'mod-old', last_updated: 100 }),
      makeMod({ id: 'mod-new', last_updated: 999 }),
    ];
    const sorted = sortTaggedItemsByLastUpdated(items);
    expect((sorted[0].item as { id: string }).id).toBe('mod-new');
  });

  it('can sort ascending', () => {
    const items = [
      makeMod({ id: 'mod-old', last_updated: 100 }),
      makeMod({ id: 'mod-new', last_updated: 999 }),
    ];
    const sorted = sortTaggedItemsByLastUpdated(items, 'asc');
    expect((sorted[0].item as { id: string }).id).toBe('mod-old');
  });

  it('does not mutate the original array', () => {
    const items = [
      makeMod({ id: 'mod-a', last_updated: 500 }),
      makeMod({ id: 'mod-b', last_updated: 100 }),
    ];
    const original = [...items];
    sortTaggedItemsByLastUpdated(items);
    expect(items).toEqual(original);
  });
});
