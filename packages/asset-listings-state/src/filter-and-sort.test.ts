import { describe, expect, it } from 'vite-plus/test';

import {
  filterAndSortTaggedItems,
  matchesMapAttributeFilters,
  matchesSingleValueFilter,
  matchesZeroOrManyValuesFilter,
  seededHash,
  sortItemsBySeed,
  type TaggedListingItem,
} from './filter-and-sort';

interface TestItem {
  id: string;
  name: string;
  tags?: string[];
  location?: string;
  quality?: string;
  levelOfDetail?: string;
  specialDemand?: string[];
}

interface TestMapFilters {
  locations: string[];
  sourceQuality: string[];
  levelOfDetail: string[];
  specialDemand: string[];
}

type TestTaggedItem = TaggedListingItem<TestItem>;

const items: TestTaggedItem[] = [
  {
    type: 'mod',
    item: { id: 'mod-ui', name: 'UI Enhancer', tags: ['ui'] },
  },
  {
    type: 'mod',
    item: { id: 'mod-sim', name: 'Signal Suite', tags: ['simulation'] },
  },
  {
    type: 'map',
    item: {
      id: 'map-eu',
      name: 'Euro Hub',
      location: 'europe',
      quality: 'verified',
      levelOfDetail: 'high',
      specialDemand: ['freight'],
    },
  },
  {
    type: 'map',
    item: {
      id: 'map-asia',
      name: 'Asia Loop',
      location: 'asia',
      quality: 'draft',
      levelOfDetail: 'medium',
      specialDemand: ['commuter'],
    },
  },
];

const mapFilters: TestMapFilters = {
  locations: [],
  sourceQuality: [],
  levelOfDetail: [],
  specialDemand: [],
};

const accessors = {
  buildSearchText: (item: TestTaggedItem) => item.item.name,
  getModTags: (item: TestTaggedItem) => item.item.tags,
  getMapLocation: (item: TestTaggedItem) => item.item.location,
  getMapQuality: (item: TestTaggedItem) => item.item.quality,
  getSelectedMapQuality: (filters: TestMapFilters) => filters.sourceQuality,
  getMapLevelOfDetail: (item: TestTaggedItem) => item.item.levelOfDetail,
  getSelectedMapLevelOfDetail: (filters: TestMapFilters) => filters.levelOfDetail,
  getMapSpecialDemand: (item: TestTaggedItem) => item.item.specialDemand,
  getSelectedMapSpecialDemand: (filters: TestMapFilters) => filters.specialDemand,
  getSelectedMapLocations: (filters: TestMapFilters) => filters.locations,
};

const compareItems = (left: TestTaggedItem, right: TestTaggedItem) =>
  left.item.name.localeCompare(right.item.name);

describe('filter helpers', () => {
  it('matches selected single values and many-values filters', () => {
    expect(matchesSingleValueFilter('europe', ['europe'])).toBe(true);
    expect(matchesSingleValueFilter('asia', ['europe'])).toBe(false);
    expect(matchesZeroOrManyValuesFilter(['ui', 'sim'], ['ui'])).toBe(true);
    expect(matchesZeroOrManyValuesFilter(['sim'], ['ui'])).toBe(false);
  });

  it('evaluates map attribute filters through accessors', () => {
    expect(
      matchesMapAttributeFilters(
        items[2],
        {
          locations: ['europe'],
          sourceQuality: ['verified'],
          levelOfDetail: ['high'],
          specialDemand: ['freight'],
        },
        accessors,
      ),
    ).toBe(true);
    expect(
      matchesMapAttributeFilters(
        items[3],
        {
          locations: ['europe'],
          sourceQuality: [],
          levelOfDetail: [],
          specialDemand: [],
        },
        accessors,
      ),
    ).toBe(false);
  });
});

describe('seeded ordering', () => {
  it('produces deterministic hashes and orderings', () => {
    expect(seededHash('map-eu', 42)).toBe(seededHash('map-eu', 42));
    expect(seededHash('map-eu', 42)).not.toBe(seededHash('map-eu', 43));

    const first = sortItemsBySeed(items, 99).map((item) => item.item.id);
    const second = sortItemsBySeed(items, 99).map((item) => item.item.id);
    expect(first).toEqual(second);
  });
});

describe('filterAndSortTaggedItems', () => {
  it('filters by type, tags, and map attributes before sorting', () => {
    const result = filterAndSortTaggedItems({
      items,
      filters: {
        query: '',
        type: 'map',
        sort: { field: 'name', direction: 'asc' },
        randomSeed: 1,
        mod: { tags: [] },
        map: {
          locations: ['europe'],
          sourceQuality: ['verified'],
          levelOfDetail: [],
          specialDemand: [],
        },
      },
      modDownloadTotals: {},
      mapDownloadTotals: {},
      compareItems,
      accessors,
      fuseOptions: { keys: ['searchText'], threshold: 0.4 },
    });

    expect(result.map((item) => item.item.id)).toEqual(['map-eu']);
  });

  it('supports text search through Fuse', () => {
    const result = filterAndSortTaggedItems({
      items,
      filters: {
        query: 'signal',
        type: 'mod',
        sort: { field: 'name', direction: 'asc' },
        randomSeed: 1,
        mod: { tags: [] },
        map: mapFilters,
      },
      modDownloadTotals: {},
      mapDownloadTotals: {},
      compareItems,
      accessors,
      fuseOptions: { keys: ['searchText'], threshold: 0.4 },
    });

    expect(result.map((item) => item.item.id)).toEqual(['mod-sim']);
  });

  it('uses seeded random ordering when random sort is requested', () => {
    const result = filterAndSortTaggedItems({
      items,
      filters: {
        query: '',
        type: 'mod',
        sort: { field: 'random', direction: 'asc' },
        randomSeed: 7,
        mod: { tags: [] },
        map: mapFilters,
      },
      modDownloadTotals: {},
      mapDownloadTotals: {},
      compareItems,
      accessors,
      fuseOptions: { keys: ['searchText'], threshold: 0.4 },
    });

    expect(result.map((item) => item.item.id)).toEqual(
      sortItemsBySeed(items.filter((item) => item.type === 'mod'), 7).map(
        (item) => item.item.id,
      ),
    );
  });
});