import { describe, expect, it } from 'vitest';

import {
  createDataFilterByAssetType,
  createDefaultDataFilters,
  createDefaultSourceFilters,
  createSourceFilterByAssetType,
} from './types';

describe('createDefaultSourceFilters', () => {
  it('defaults to the shared browse shape', () => {
    const filters = createDefaultSourceFilters();
    expect(filters.type).toBe('map');
    expect(filters.sort).toEqual({ field: 'last_updated', direction: 'desc' });
    expect(filters.perPage).toBe(12);
    expect(filters.mod.tags).toEqual([]);
    expect(filters.map.sourceQuality).toEqual([]);
  });

  it('supports overriding type and per-page', () => {
    const filters = createDefaultSourceFilters('mod', 24);
    expect(filters.type).toBe('mod');
    expect(filters.perPage).toBe(24);
  });
});

describe('createDefaultDataFilters', () => {
  it('creates the website data-quality filter shape', () => {
    const filters = createDefaultDataFilters();
    expect(filters.type).toBe('map');
    expect(filters.map.dataQuality).toEqual([]);
    expect(filters.map.levelOfDetail).toEqual([]);
    expect(filters.map.specialDemand).toEqual([]);
  });
});

describe('filter-by-type factories', () => {
  it('creates source filter state for each asset type', () => {
    const filters = createDefaultSourceFilters();
    const byType = createSourceFilterByAssetType(filters, 3);
    expect(byType.mod.page).toBe(3);
    expect(byType.map.page).toBe(3);
    byType.mod.mod.tags.push('ui');
    expect(byType.map.mod.tags).toEqual([]);
  });

  it('creates data filter state for each asset type', () => {
    const filters = createDefaultDataFilters();
    const byType = createDataFilterByAssetType(filters, 2);
    expect(byType.mod.page).toBe(2);
    expect(byType.map.page).toBe(2);
    byType.map.map.dataQuality.push('verified');
    expect(byType.mod.map.dataQuality).toEqual([]);
  });
});