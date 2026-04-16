import { DEFAULT_SORT_STATE, type AssetType } from '@subway-builder-modded/config';
import { describe, expect, it } from 'vite-plus/test';

import {
  applyFilter,
  cloneFilterState,
  createFilterByAssetType,
  createRandomSeed,
  switchFilter,
  syncFilter,
  toAssetFilterState,
  type BaseAssetQueryFilterState,
} from './asset-filter-state';

interface TestMapFilters {
  locations: string[];
  sourceQuality: string[];
  levelOfDetail: string[];
  specialDemand: string[];
}

type TestFilterState = BaseAssetQueryFilterState<AssetType, TestMapFilters>;

const ASSET_TYPES: readonly AssetType[] = ['mod', 'map'];

const defaultSearchFilters: TestFilterState = {
  query: '',
  type: 'map',
  sort: DEFAULT_SORT_STATE,
  randomSeed: 123,
  perPage: 12,
  mod: {
    tags: [],
  },
  map: {
    locations: [],
    sourceQuality: [],
    levelOfDetail: [],
    specialDemand: [],
  },
};

describe('createRandomSeed', () => {
  it('returns a positive integer within range', () => {
    const seed = createRandomSeed();
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(2_147_483_647);
    expect(Number.isInteger(seed)).toBe(true);
  });
});

describe('cloneFilterState', () => {
  it('creates a deep clone of filter fields', () => {
    const original: TestFilterState = {
      ...defaultSearchFilters,
      mod: { tags: ['ui'] },
      map: {
        locations: ['europe'],
        sourceQuality: ['high-quality'],
        levelOfDetail: [],
        specialDemand: [],
      },
    };

    const cloned = cloneFilterState(original);
    cloned.mod.tags.push('gameplay');
    cloned.map.locations.push('asia');

    expect(original.mod.tags).toEqual(['ui']);
    expect(original.map.locations).toEqual(['europe']);
  });
});

describe('toAssetFilterState', () => {
  it('copies filter fields and attaches page', () => {
    const state = toAssetFilterState(
      { ...defaultSearchFilters, mod: { tags: ['ui'] } },
      3,
    );
    expect(state.page).toBe(3);
    expect(state.mod.tags).toEqual(['ui']);
  });

  it('clones arrays so mutations are isolated', () => {
    const source = { ...defaultSearchFilters, mod: { tags: ['ui'] } };
    const state = toAssetFilterState(source, 1);
    state.mod.tags.push('extra');
    expect(source.mod.tags).toEqual(['ui']);
  });
});

describe('createFilterByAssetType', () => {
  it('creates an entry for each asset type', () => {
    const byType = createFilterByAssetType(ASSET_TYPES, defaultSearchFilters, 2);
    expect(byType.mod.page).toBe(2);
    expect(byType.map.page).toBe(2);
  });

  it('creates independent clones for each type', () => {
    const byType = createFilterByAssetType(ASSET_TYPES, defaultSearchFilters, 1);
    byType.mod.mod.tags.push('mutated');
    expect(byType.map.mod.tags).toEqual([]);
  });
});

describe('syncFilter', () => {
  it('updates the active type only', () => {
    const initial = createFilterByAssetType(ASSET_TYPES, defaultSearchFilters, 1);
    const updated = syncFilter(
      initial,
      { ...defaultSearchFilters, type: 'mod', mod: { tags: ['ui'] } },
      5,
    );

    expect(updated.mod.mod.tags).toEqual(['ui']);
    expect(updated.mod.page).toBe(5);
    expect(updated.map.mod.tags).toEqual([]);
    expect(updated.map.page).toBe(1);
  });
});

describe('applyFilter', () => {
  it('overlays scoped state onto the base filters with the new type', () => {
    const base: TestFilterState = {
      ...defaultSearchFilters,
      type: 'mod',
      query: 'test',
      perPage: 24,
    };
    const scopedState = toAssetFilterState(
      { ...defaultSearchFilters, mod: { tags: ['gameplay'] } },
      4,
    );

    const result = applyFilter(base, 'map', scopedState);

    expect(result.type).toBe('map');
    expect(result.query).toBe('test');
    expect(result.perPage).toBe(24);
    expect(result.mod.tags).toEqual(['gameplay']);
  });
});

describe('switchFilter', () => {
  it('saves the current type state and restores the target type state', () => {
    const initial = createFilterByAssetType(ASSET_TYPES, defaultSearchFilters, 1);
    const modFilters: TestFilterState = {
      ...defaultSearchFilters,
      type: 'mod',
      mod: { tags: ['ui'] },
    };

    const result = switchFilter(modFilters, 3, initial, 'map');

    expect(result.scopedByType.mod.mod.tags).toEqual(['ui']);
    expect(result.scopedByType.mod.page).toBe(3);
    expect(result.filters.type).toBe('map');
    expect(result.page).toBe(1);
  });

  it('round-trips type switches while preserving each type independently', () => {
    const initial = createFilterByAssetType(ASSET_TYPES, defaultSearchFilters, 1);
    const mapFilters: TestFilterState = {
      ...defaultSearchFilters,
      type: 'map',
      map: {
        locations: ['europe'],
        sourceQuality: [],
        levelOfDetail: [],
        specialDemand: [],
      },
    };

    const afterMapEdit = switchFilter(mapFilters, 2, initial, 'mod');
    const afterSwitchBack = switchFilter(
      afterMapEdit.filters,
      afterMapEdit.page,
      afterMapEdit.scopedByType,
      'map',
    );

    expect(afterSwitchBack.filters.type).toBe('map');
    expect(afterSwitchBack.filters.map.locations).toEqual(['europe']);
    expect(afterSwitchBack.page).toBe(2);
  });
});