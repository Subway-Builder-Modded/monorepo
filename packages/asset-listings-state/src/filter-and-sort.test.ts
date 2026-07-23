import { describe, expect, it } from 'vitest';

import {
  buildAssetSearchText,
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
import {
  buildCountryCodeSearchTerms,
  normalizeMapCountry,
  reverseIsoCountryCodeToNames,
} from './country-search';

interface TestItem {
  id: string;
  name: string;
  description?: string;
  search_aliases?: string[];
  city_code?: string;
  country?: string;
  tags?: string[];
  location?: string;
  quality?: string;
  levelOfDetail?: string;
  specialDemand?: string[];
}

interface TestMapFilters {
  locations: string[];
  dataQuality: string[];
  levelOfDetail: string[];
  specialDemand: string[];
}

type TestTaggedItem = TaggedListingItem<TestItem>;
type SearchFilters = {
  query: string;
  type: 'mod' | 'map';
  sort: { field: string; direction: 'asc' | 'desc' };
  randomSeed: number;
  perPage: number;
  mod: { tags: string[] };
  map: TestMapFilters;
};

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
  dataQuality: [],
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
    countKey: 'mapDataQualityCounts',
    assetType: 'map',
    cardinality: 'single',
    getValue: (item) => item.item.quality,
    getSelected: (filters) => filters.map.dataQuality,
    filterParent: 'map',
    filterKey: 'dataQuality',
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

const searchAccessors: TaggedListingAccessors<TestTaggedItem, TestMapFilters> = {
  buildSearchText: (item) => buildAssetSearchText(item, () => ''),
  dimensions: testDimensions,
};

const compareItems = (left: TestTaggedItem, right: TestTaggedItem) =>
  left.item.name.localeCompare(right.item.name);

const searchFuseOptions = { keys: ['searchText'], threshold: 0.4 } as const;

function getRegionEndonym(locale: string, code: string): string | undefined {
  return new Intl.DisplayNames([locale], { type: 'region' }).of(code);
}

function foldAscii(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}+/gu, '');
}

function makeMapItem(overrides: Partial<TestItem> = {}): TestTaggedItem {
  return {
    type: 'map',
    item: {
      id: 'map-prague',
      name: 'Prague Metro',
      country: 'CZ',
      city_code: 'PRG',
      ...overrides,
    },
  };
}

function makeFilters(overrides: Partial<SearchFilters>): SearchFilters {
  return {
    query: '',
    type: 'map',
    sort: { field: 'name', direction: 'asc' },
    randomSeed: 1,
    perPage: 12,
    mod: { tags: [] },
    map: mapFilters,
    ...overrides,
  };
}

function runSearch(
  searchItems: TestTaggedItem[],
  filters: Partial<SearchFilters>,
): TestTaggedItem[] {
  return filterAndSortTaggedItems({
    items: searchItems,
    filters: makeFilters(filters),
    modDownloadTotals: {},
    mapDownloadTotals: {},
    compareItems,
    accessors: searchAccessors,
    fuseOptions: searchFuseOptions,
  });
}

function expectCountryAliasesPresent(
  searchText: string,
  code: string,
  exonym: string,
  endonym: string | undefined,
) {
  expect(searchText).toContain(code);
  expect(searchText).toContain(exonym);
  if (endonym) {
    expect(searchText).toContain(endonym);
    expect(searchText).toContain(foldAscii(endonym));
  }
}

describe('filter helpers', () => {
  it('matches selected single values and many-values filters', () => {
    expect(matchesSingleValueFilter('europe', ['europe'])).toBe(true);
    expect(matchesSingleValueFilter('asia', ['europe'])).toBe(false);
    expect(matchesZeroOrManyValuesFilter(['ui', 'sim'], ['ui'])).toBe(true);
    expect(matchesZeroOrManyValuesFilter(['sim'], ['ui'])).toBe(false);
  });
});

describe('country search helpers', () => {
  it('normalizes ISO country codes once at the manifest boundary', () => {
    expect(normalizeMapCountry(' cz ')).toBe('CZ');
    expect(normalizeMapCountry(' Ukraine ')).toBe('');
    expect(normalizeMapCountry('1!')).toBe('');
    expect(normalizeMapCountry(undefined)).toBe('');
  });

  it('expands ISO country codes into exonym and endonym search terms', () => {
    const czechEndonym = getRegionEndonym('cs-CZ', 'CZ');
    const ukrainianEndonym = getRegionEndonym('uk-UA', 'UA');

    expect(reverseIsoCountryCodeToNames('CZ')).toEqual(
      expect.arrayContaining([
        'CZ',
        'Czechia',
        'Czech Republic',
        czechEndonym ?? '',
      ]),
    );
    if (czechEndonym) {
      expect(reverseIsoCountryCodeToNames('CZ')).toContain(foldAscii(czechEndonym));
    }
    expect(reverseIsoCountryCodeToNames('UA')).toEqual(
      expect.arrayContaining(['UA', 'Ukraine', ukrainianEndonym ?? '']),
    );
    expect(reverseIsoCountryCodeToNames('GB')).toEqual(
      expect.arrayContaining(['GB', 'United Kingdom', 'UK']),
    );
  });

  it('keeps non-ISO country labels searchable without expansion', () => {
    expect(buildCountryCodeSearchTerms('Czechia')).toEqual([]);
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
  it('includes country aliases in map search text', () => {
    const czechEndonym = getRegionEndonym('cs-CZ', 'CZ');
    const searchText = buildAssetSearchText(makeMapItem(), () => '');

    expectCountryAliasesPresent(searchText, 'CZ', 'Czechia', czechEndonym);
  });

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
          dataQuality: ['verified'],
          levelOfDetail: [],
          specialDemand: [],
        },
      },
      modDownloadTotals: {},
      mapDownloadTotals: {},
      compareItems,
      accessors,
      fuseOptions: searchFuseOptions,
    });

    expect(result.map((item) => item.item.id)).toEqual(['map-eu']);
  });

  it('supports text search through Fuse', () => {
    const result = filterAndSortTaggedItems({
      items,
      filters: makeFilters({
        query: 'signal',
        type: 'mod',
      }),
      modDownloadTotals: {},
      mapDownloadTotals: {},
      compareItems,
      accessors,
      fuseOptions: searchFuseOptions,
    });

    expect(result.map((item) => item.item.id)).toEqual(['mod-sim']);
  });

  it('matches map queries against country exonyms and endonyms', () => {
    const result = runSearch([makeMapItem()], {
      query: 'cesko',
    });

    expect(result.map((item) => item.item.id)).toEqual(['map-prague']);
  });

  it('excludes description from the search text but includes tags', () => {
    const searchText = buildAssetSearchText(
      makeMapItem({
        description: 'Warszawa appears only in the blurb',
        tags: ['nightlife'],
      }),
      () => '',
    );

    expect(searchText).toContain('Prague Metro');
    expect(searchText).toContain('nightlife');
    expect(searchText).not.toContain('Warszawa');
  });

  it('does not match maps by description body text', () => {
    const result = runSearch(
      [makeMapItem({ description: 'this blurb mentions Warszawa repeatedly' })],
      { query: 'warszawa' },
    );

    expect(result).toEqual([]);
  });

  it('matches maps by their tags', () => {
    const result = runSearch([makeMapItem({ tags: ['nightlife'] })], {
      query: 'nightlife',
    });

    expect(result.map((item) => item.item.id)).toEqual(['map-prague']);
  });

  it('matches maps by registry-provided search aliases (e.g. city exonyms)', () => {
    // 'varsovie' appears only in search_aliases — not the name, country, or location.
    const result = runSearch(
      [makeMapItem({ search_aliases: ['Warsaw', 'Varsovie'] })],
      { query: 'varsovie' },
    );

    expect(result.map((item) => item.item.id)).toEqual(['map-prague']);
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
      fuseOptions: searchFuseOptions,
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
          dataQuality: ['verified'],
          levelOfDetail: [],
          specialDemand: [],
        },
      },
      accessors,
      fuseOptions: searchFuseOptions,
    });

    expect(counts.mapCount).toBe(1);
    expect(counts.mapDataQualityCounts).toEqual({
      verified: 1,
      draft: 1,
    });
    expect(counts.mapLevelOfDetailCounts).toEqual({ high: 1 });
    expect(counts.mapSpecialDemandCounts).toEqual({ tram: 1 });
    expect(counts.mapLocationCounts).toEqual({ 'east-asia': 1 });
  });
});
