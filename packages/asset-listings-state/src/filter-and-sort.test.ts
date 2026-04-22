import { describe, expect, it } from 'vitest';

import {
  buildFilteredTaggedListingCounts,
  filterAndSortTaggedItems,
  matchesSingleValueFilter,
  matchesZeroOrManyValuesFilter,
  seededHash,
  sortItemsBySeed,
  type AssetDimension,
  type TaggedListingAccessors,
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

const testDimensions: AssetDimension<TestTaggedItem, TestMapFilters>[] = [
  {
    countKey: 'modTagCounts',
    assetType: 'mod',
    cardinality: 'multi',
    getValue: (item) => item.item.tags,
    getSelected: (filters) => filters.mod.tags,
    filterParent: 'mod',
    filterKey: 'tags',
  },
  {
    countKey: 'mapLocationCounts',
    assetType: 'map',
    cardinality: 'single',
    getValue: (item) => item.item.location,
    getSelected: (filters) => filters.map.locations,
    filterParent: 'map',
    filterKey: 'locations',
  },
  {
    countKey: 'mapSourceQualityCounts',
    assetType: 'map',
    cardinality: 'single',
    getValue: (item) => item.item.quality,
    getSelected: (filters) => filters.map.sourceQuality,
    filterParent: 'map',
    filterKey: 'sourceQuality',
  },
  {
    countKey: 'mapLevelOfDetailCounts',
    assetType: 'map',
    cardinality: 'single',
    getValue: (item) => item.item.levelOfDetail,
    getSelected: (filters) => filters.map.levelOfDetail,
    filterParent: 'map',
    filterKey: 'levelOfDetail',
  },
  {
    countKey: 'mapSpecialDemandCounts',
    assetType: 'map',
    cardinality: 'multi',
    getValue: (item) => item.item.specialDemand,
    getSelected: (filters) => filters.map.specialDemand,
    filterParent: 'map',
    filterKey: 'specialDemand',
  },
];

const accessors: TaggedListingAccessors<TestTaggedItem, TestMapFilters> = {
  buildSearchText: (item) => item.item.name,
  dimensions: testDimensions,
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
        perPage: 12,
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
        perPage: 12,
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
        perPage: 12,
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

  it('builds dimension counts from the current filtered candidate set', () => {
    const counts = buildFilteredTaggedListingCounts({
      items: [
        ...items,
        {
          type: 'map',
          item: {
            id: 'map-east-verified',
            name: 'East Verified',
            location: 'east-asia',
            quality: 'verified',
            levelOfDetail: 'high',
            specialDemand: ['tram'],
          },
        },
        {
          type: 'map',
          item: {
            id: 'map-east-draft',
            name: 'East Draft',
            location: 'east-asia',
            quality: 'draft',
            levelOfDetail: 'low',
            specialDemand: ['metro'],
          },
        },
      ],
      filters: {
        query: 'east',
        type: 'map',
        sort: { field: 'name', direction: 'asc' },
        randomSeed: 1,
        perPage: 12,
        mod: { tags: [] },
        map: {
          locations: ['east-asia'],
          sourceQuality: ['verified'],
          levelOfDetail: [],
          specialDemand: [],
        },
      },
      accessors,
      fuseOptions: { keys: ['searchText'], threshold: 0.4 },
    });

    expect(counts.mapCount).toBe(1);
    expect(counts.mapSourceQualityCounts).toEqual({
      verified: 1,
      draft: 1,
    });
    expect(counts.mapLevelOfDetailCounts).toEqual({ high: 1 });
    expect(counts.mapSpecialDemandCounts).toEqual({ tram: 1 });
    expect(counts.mapLocationCounts).toEqual({ 'east-asia': 1 });
  });
});
