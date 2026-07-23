import { describe, expect, it } from 'vitest';

import {
  buildSpecialDemandValues,
  DATA_QUALITY_TIER_VALUES,
  EFFECTIVE_DATA_QUALITY_VALUES,
  formatDataQuality,
  formatSourceQuality,
  LEVEL_OF_DETAIL_VALUES,
  LOCATION_TAGS,
  resolveEffectiveDataQuality,
  SOURCE_QUALITY_VALUES,
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

describe('SOURCE_QUALITY_VALUES', () => {
  it('contains low, medium, and high quality options', () => {
    expect(SOURCE_QUALITY_VALUES).toContain('low-quality');
    expect(SOURCE_QUALITY_VALUES).toContain('medium-quality');
    expect(SOURCE_QUALITY_VALUES).toContain('high-quality');
  });
});

describe('LEVEL_OF_DETAIL_VALUES', () => {
  it('contains low, medium, and high detail options', () => {
    expect(LEVEL_OF_DETAIL_VALUES).toContain('low-detail');
    expect(LEVEL_OF_DETAIL_VALUES).toContain('medium-detail');
    expect(LEVEL_OF_DETAIL_VALUES).toContain('high-detail');
  });
});

describe('formatSourceQuality', () => {
  it('maps known values to their display labels', () => {
    expect(formatSourceQuality('low-quality')).toBe('low-data-quality');
    expect(formatSourceQuality('medium-quality')).toBe('medium-data-quality');
    expect(formatSourceQuality('high-quality')).toBe('high-data-quality');
  });

  it('returns the original value for unknown strings', () => {
    expect(formatSourceQuality('mystery-quality')).toBe('mystery-quality');
  });
});

describe('DATA_QUALITY_TIER_VALUES', () => {
  it('contains the seven rubric tiers in best-to-unscored order', () => {
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

  it('orders effective filter values tiers-first with legacy values last', () => {
    expect(EFFECTIVE_DATA_QUALITY_VALUES.slice(0, 7)).toEqual([
      ...DATA_QUALITY_TIER_VALUES,
    ]);
    expect(EFFECTIVE_DATA_QUALITY_VALUES).toContain('high-quality');
  });

  it('formats tiers with data-quality labels and unknown as unscored', () => {
    expect(formatDataQuality('very-high')).toBe('very-high-data-quality');
    expect(formatDataQuality('absent')).toBe('absent-data-quality');
    expect(formatDataQuality('unknown')).toBe('unscored');
  });
});

describe('resolveEffectiveDataQuality', () => {
  it('prefers the data_quality tier when the block is present', () => {
    expect(
      resolveEffectiveDataQuality({
        data_quality: { tier: 'high' },
        source_quality: 'low-quality',
      }),
    ).toBe('high');
  });

  it('never falls back to the self-report for unscored maps', () => {
    expect(
      resolveEffectiveDataQuality({
        data_quality: { tier: 'unknown' },
        source_quality: 'high-quality',
      }),
    ).toBe('unknown');
  });

  it('uses the legacy source_quality only when the block is absent', () => {
    expect(
      resolveEffectiveDataQuality({ source_quality: 'medium-quality' }),
    ).toBe('medium-quality');
    expect(resolveEffectiveDataQuality({})).toBeUndefined();
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
