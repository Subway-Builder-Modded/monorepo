import { describe, expect, it } from 'vitest';

import {
  buildDimensionCounts,
  buildSearchText,
  createTaggedListingAccessors,
  type FrontendTaggedListingItem,
} from '@/lib/tagged-listing-filters';

import type { types } from '../../wailsjs/go/models';

function createModManifest(
  overrides: Partial<types.ModManifest> = {},
): types.ModManifest {
  return {
    id: 'mod-ui-pack',
    name: 'UI Pack',
    description: 'Adds interface polish',
    author: {
      author_id: 'builder',
      author_alias: 'Builder',
      attribution_link: '',
    },
    tags: ['ui', 'qol'],
    gallery: [],
    source: '',
    schema_version: 1,
    github_id: 0,
    last_updated: 0,
    update: { type: 'none' } as unknown as types.ModManifest['update'],
    ...overrides,
  } as types.ModManifest;
}

function createMapManifest(
  overrides: Partial<types.MapManifest> = {},
): types.MapManifest {
  return {
    id: 'map-tokyo',
    name: 'Tokyo',
    description: 'Dense regional network',
    author: {
      author_id: 'mapper',
      author_alias: 'Mapper',
      attribution_link: '',
    },
    city_code: 'TKY',
    country: 'Japan',
    location: 'east-asia',
    population: 100,
    data_source: '',
    source_quality: 'official',
    level_of_detail: 'full',
    special_demand: ['commuter'],
    initial_view_state: {
      latitude: 0,
      longitude: 0,
      zoom: 0,
      bearing: 0,
    },
    tags: [],
    gallery: [],
    source: '',
    schema_version: 1,
    github_id: 0,
    last_updated: 0,
    update: { type: 'none' } as unknown as types.MapManifest['update'],
    ...overrides,
  } as types.MapManifest;
}

describe('tagged-listing-filters', () => {
  it('buildSearchText includes relevant mod and map fields', () => {
    const modItem: FrontendTaggedListingItem = {
      type: 'mod',
      item: createModManifest(),
    };
    const mapItem: FrontendTaggedListingItem = {
      type: 'map',
      item: createMapManifest(),
    };

    expect(buildSearchText(modItem)).toContain('Builder');
    expect(buildSearchText(modItem)).toContain('ui');
    expect(buildSearchText(mapItem)).toContain('east-asia');
    expect(buildSearchText(mapItem)).toContain('commuter');
  });

  it('creates accessors with dimensions that normalize values for mods and maps', () => {
    const accessors = createTaggedListingAccessors<FrontendTaggedListingItem>();
    const modItem: FrontendTaggedListingItem = {
      type: 'mod',
      item: createModManifest({ tags: undefined }),
    };
    const mapItem: FrontendTaggedListingItem = {
      type: 'map',
      item: createMapManifest({
        source_quality: '',
        level_of_detail: '',
        special_demand: undefined,
      }),
    };

    const findDim = (key: string) =>
      accessors.dimensions.find((f) => f.countKey === key)!;

    expect(accessors.buildSearchText(modItem)).toContain('UI Pack');

    const modTags = findDim('modTagCounts');
    expect(modTags.getValue(modItem)).toEqual([]);
    expect(modTags.getValue(mapItem)).toBeUndefined();

    const mapLocation = findDim('mapLocationCounts');
    expect(mapLocation.getValue(mapItem)).toBe('east-asia');
    expect(mapLocation.getValue(modItem)).toBeUndefined();

    const mapQuality = findDim('mapSourceQualityCounts');
    expect(mapQuality.getValue(mapItem)).toBe('');

    const emptyFilters = {
      mod: { tags: [] },
      map: {} as Record<string, string[]>,
    };
    expect(mapQuality.getSelected(emptyFilters)).toEqual([]);
    expect(findDim('mapLevelOfDetailCounts').getSelected(emptyFilters)).toEqual(
      [],
    );
    expect(findDim('mapSpecialDemandCounts').getSelected(emptyFilters)).toEqual(
      [],
    );
    expect(mapLocation.getSelected(emptyFilters)).toEqual([]);

    const mapLod = findDim('mapLevelOfDetailCounts');
    expect(mapLod.getValue(mapItem)).toBe('');

    const mapDemand = findDim('mapSpecialDemandCounts');
    expect(mapDemand.getValue(mapItem)).toEqual([]);

    expect(
      mapQuality.getSelected({
        mod: { tags: [] },
        map: { sourceQuality: ['official'] },
      }),
    ).toEqual(['official']);
    expect(
      mapLod.getSelected({
        mod: { tags: [] },
        map: { levelOfDetail: ['full'] },
      }),
    ).toEqual(['full']);
    expect(
      mapDemand.getSelected({
        mod: { tags: [] },
        map: { specialDemand: ['commuter'] },
      }),
    ).toEqual(['commuter']);
    expect(
      mapLocation.getSelected({
        mod: { tags: [] },
        map: { locations: ['east-asia'] },
      }),
    ).toEqual(['east-asia']);
  });

  it('builds dimension counts from the currently filtered frontend items', () => {
    const items: FrontendTaggedListingItem[] = [
      {
        type: 'map',
        item: createMapManifest({
          id: 'map-tokyo',
          location: 'east-asia',
          source_quality: 'official',
          level_of_detail: 'full',
          special_demand: ['commuter'],
        }),
      },
      {
        type: 'map',
        item: createMapManifest({
          id: 'map-seoul',
          name: 'Seoul',
          location: 'east-asia',
          source_quality: 'community',
          level_of_detail: 'basic',
          special_demand: ['tourist'],
        }),
      },
      {
        type: 'map',
        item: createMapManifest({
          id: 'map-paris',
          name: 'Paris',
          location: 'europe',
          source_quality: 'official',
          level_of_detail: 'full',
          special_demand: ['tourist'],
        }),
      },
      {
        type: 'mod',
        item: createModManifest({
          id: 'mod-ui-pack',
          tags: ['ui'],
        }),
      },
      {
        type: 'mod',
        item: createModManifest({
          id: 'mod-audio-pack',
          name: 'Audio Pack',
          tags: ['audio'],
        }),
      },
    ];

    const mapCounts = buildDimensionCounts({
      items,
      filters: {
        query: '',
        type: 'map',
        sort: { field: 'name', direction: 'asc' },
        randomSeed: 1,
        perPage: 12,
        mod: { tags: [] },
        map: {
          locations: ['east-asia'],
          sourceQuality: [],
          levelOfDetail: [],
          specialDemand: [],
        },
      },
    });

    expect(mapCounts.mapCount).toBe(2);
    expect(mapCounts.mapLocationCounts).toEqual({
      'east-asia': 2,
      europe: 1,
    });
    expect(mapCounts.mapSourceQualityCounts).toEqual({
      official: 1,
      community: 1,
    });
    expect(mapCounts.mapLevelOfDetailCounts).toEqual({
      full: 1,
      basic: 1,
    });
    expect(mapCounts.mapSpecialDemandCounts).toEqual({
      commuter: 1,
      tourist: 1,
    });

    const modCounts = buildDimensionCounts({
      items,
      filters: {
        query: '',
        type: 'mod',
        sort: { field: 'name', direction: 'asc' },
        randomSeed: 1,
        perPage: 12,
        mod: { tags: ['ui'] },
        map: {
          locations: [],
          sourceQuality: [],
          levelOfDetail: [],
          specialDemand: [],
        },
      },
    });

    expect(modCounts.modCount).toBe(1);
    expect(modCounts.modTagCounts).toEqual({
      ui: 1,
      audio: 1,
    });
  });
});
