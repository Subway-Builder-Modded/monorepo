import { describe, expect, it } from 'vitest';

import {
  buildSpecialDemandValues,
  DATA_QUALITY_TIER_VALUES,
  formatDataQuality,
  LEVEL_OF_DETAIL_VALUES,
  LOCATION_TAGS,
  resolveDataQualityTier,
} from './map-filter-values';

describe('LOCATION_TAGS', () => {
  it('is a non-empty list of region strings', () => {
    expect(LOCATION_TAGS.length).toBeGreaterThan(0);
    expect(LOCATION_TAGS).not.toContain('europe');
    expect(LOCATION_TAGS).toContain('central-europe');
    expect(LOCATION_TAGS).toContain('east-europe');
    expect(LOCATION_TAGS).toContain('north-europe');
    expect(LOCATION_TAGS).toContain('south-europe');
    expect(LOCATION_TAGS).toContain('west-europe');
    expect(LOCATION_TAGS).toContain('north-america');
  });

  it('includes all europe sub-region tags', () => {
    expect(LOCATION_TAGS).toContain('north-europe');
    expect(LOCATION_TAGS).toContain('west-europe');
    expect(LOCATION_TAGS).toContain('south-europe');
    expect(LOCATION_TAGS).toContain('central-europe');
    expect(LOCATION_TAGS).toContain('east-europe');
  });
});

describe('LEVEL_OF_DETAIL_VALUES', () => {
  it('contains low, medium, and high detail options', () => {
    expect(LEVEL_OF_DETAIL_VALUES).toContain('low-detail');
    expect(LEVEL_OF_DETAIL_VALUES).toContain('medium-detail');
    expect(LEVEL_OF_DETAIL_VALUES).toContain('high-detail');
  });
});

describe('DATA_QUALITY_TIER_VALUES', () => {
  it('contains the data-quality tiers in best-to-unscored order', () => {
    expect(DATA_QUALITY_TIER_VALUES).toEqual([
      'very-high',
      'high',
      'medium',
      'low',
      'very-low',
      'absent',
      'unknown',
    ]);
  });
});

describe('formatDataQuality', () => {
  it('displays tiers as their raw value and unknown as unscored', () => {
    expect(formatDataQuality('very-high')).toBe('very-high');
    expect(formatDataQuality('high')).toBe('high');
    expect(formatDataQuality('absent')).toBe('absent');
    expect(formatDataQuality('unknown')).toBe('unscored');
  });

  it('returns the original value for unknown strings', () => {
    expect(formatDataQuality('mystery-quality')).toBe('mystery-quality');
  });
});

describe('resolveDataQualityTier', () => {
  it('returns the tier from the data_quality block', () => {
    expect(resolveDataQualityTier({ data_quality: { tier: 'high' } })).toBe('high');
    expect(resolveDataQualityTier({ data_quality: { tier: 'unknown' } })).toBe(
      'unknown',
    );
  });

  it('treats a missing block as unknown and never reads the legacy field', () => {
    expect(resolveDataQualityTier({})).toBe('unknown');
    expect(
      resolveDataQualityTier({
        source_quality: 'high-quality',
      } as Record<string, unknown>),
    ).toBe('unknown');
  });
});

describe('buildSpecialDemandValues', () => {
  it('collects and deduplicates special demand values across maps', () => {
    const values = buildSpecialDemandValues([
      { special_demand: ['tram', 'metro'] },
      { special_demand: ['tram', 'ferry'] },
    ]);
    expect(values).toEqual(['ferry', 'metro', 'tram']);
  });

  it('returns empty array when no maps have special demand', () => {
    expect(buildSpecialDemandValues([{}, { special_demand: null }])).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(buildSpecialDemandValues([])).toEqual([]);
  });
});
