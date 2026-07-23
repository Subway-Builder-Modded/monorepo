import { describe, expect, it } from 'vitest';

import {
  buildAssetListingCounts,
  buildListingCounts,
  filterVisibleListingValues,
} from './listing-counts';

describe('buildListingCounts', () => {
  it('counts values across items', () => {
    const counts = buildListingCounts({
      valuesByItem: [['europe', 'north-america'], ['europe']],
    });
    expect(counts).toEqual({ europe: 2, 'north-america': 1 });
  });

  it('deduplicates values per item by default', () => {
    const counts = buildListingCounts({
      valuesByItem: [['europe', 'europe', 'asia']],
    });
    expect(counts.europe).toBe(1);
    expect(counts.asia).toBe(1);
  });

  it('counts duplicates within an item when dedupePerItem is false', () => {
    const counts = buildListingCounts({
      valuesByItem: [['europe', 'europe']],
      dedupePerItem: false,
    });
    expect(counts.europe).toBe(2);
  });

  it('ignores null and undefined values', () => {
    const counts = buildListingCounts({
      valuesByItem: [[null, undefined, 'europe']],
    });
    expect(counts).toEqual({ europe: 1 });
  });

  it('returns empty object for empty input', () => {
    expect(buildListingCounts({ valuesByItem: [] })).toEqual({});
  });
});

describe('buildAssetListingCounts', () => {
  it('counts mod tags', () => {
    const { modTagCounts } = buildAssetListingCounts(
      [{ tags: ['ui', 'gameplay'] }, { tags: ['ui'] }],
      [],
    );
    expect(modTagCounts).toEqual({ ui: 2, gameplay: 1 });
  });

  it('counts map location, source quality, and level of detail', () => {
    const result = buildAssetListingCounts([], [
      {
        location: 'europe',
        data_quality: { tier: 'high' },
        level_of_detail: 'high-detail',
      },
      {
        location: 'europe',
        level_of_detail: 'low-detail',
      },
    ]);

    expect(result.mapLocationCounts).toEqual({ europe: 2 });
    // A map without a data_quality block counts as unknown (Unscored).
    expect(result.mapSourceQualityCounts).toEqual({
      high: 1,
      unknown: 1,
    });
    expect(result.mapLevelOfDetailCounts).toEqual({
      'high-detail': 1,
      'low-detail': 1,
    });
  });

  it('counts map special demand values across maps', () => {
    const { mapSpecialDemandCounts } = buildAssetListingCounts(
      [],
      [{ special_demand: ['tram', 'metro'] }, { special_demand: ['tram'] }],
    );
    expect(mapSpecialDemandCounts).toEqual({ tram: 2, metro: 1 });
  });

  it('handles missing fields gracefully', () => {
    const result = buildAssetListingCounts([{}], [{}]);
    expect(result.modTagCounts).toEqual({});
    expect(result.mapLocationCounts).toEqual({});
  });

  it('uses sub_location over location when present', () => {
    const { mapLocationCounts } = buildAssetListingCounts([], [
      { location: 'europe', sub_location: 'central-europe' },
      { location: 'europe', sub_location: 'south-europe' },
      { location: 'europe' },
    ]);
    expect(mapLocationCounts).toEqual({ 'central-europe': 1, 'south-europe': 1, europe: 1 });
  });
});

describe('filterVisibleListingValues', () => {
  it('includes values that appear in counts', () => {
    const visible = filterVisibleListingValues(
      ['europe', 'asia', 'africa'],
      { europe: 3, asia: 1 },
      [],
    );
    expect(visible).toEqual(['europe', 'asia']);
  });

  it('includes selected values even when count is zero', () => {
    const visible = filterVisibleListingValues(['europe', 'asia'], { europe: 0 }, ['europe']);
    expect(visible).toContain('europe');
  });

  it('excludes values with zero count that are not selected', () => {
    expect(filterVisibleListingValues(['africa'], { africa: 0 }, [])).toEqual([]);
  });
});