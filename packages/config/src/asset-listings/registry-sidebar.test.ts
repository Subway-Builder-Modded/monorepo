import { describe, expect, it } from 'vitest';

import {
  buildRegistryTagCategories,
  buildRegistryTagCounts,
  formatRegistryTagLabel,
} from './registry-sidebar';

describe('buildRegistryTagCategories', () => {
  it('groups map tags in canonical section order', () => {
    const categories = buildRegistryTagCategories({
      typeId: 'maps',
      availableTags: [
        'schools',
        'europe',
        'medium-detail',
        'high-quality',
        'custom-tag',
      ],
    });

    expect(categories.map((category) => category.id)).toEqual([
      'regions',
      'data-quality',
      'level-of-detail',
      'special-demand',
      'other',
    ]);
    expect(categories[0]?.tags).toEqual(['europe']);
    expect(categories[1]?.tags).toEqual(['high-quality']);
    expect(categories[2]?.tags).toEqual(['medium-detail']);
    expect(categories[3]?.tags).toEqual(['schools']);
    expect(categories[4]?.tags).toEqual(['custom-tag']);
  });

  it('includes map quality/detail values present in manifest fields', () => {
    const categories = buildRegistryTagCategories({
      typeId: 'maps',
      availableTags: ['north-america'],
      mapSourceQualityValues: ['medium-quality'],
      mapLevelOfDetailValues: ['high-detail'],
    });

    const qualityCategory = categories.find((category) => category.id === 'data-quality');
    const detailCategory = categories.find((category) => category.id === 'level-of-detail');

    expect(qualityCategory?.tags).toEqual(['medium-quality']);
    expect(detailCategory?.tags).toEqual(['high-detail']);
  });

  it('groups mod tags into content and other', () => {
    const categories = buildRegistryTagCategories({
      typeId: 'mods',
      availableTags: ['ui', 'custom-mod-tag'],
    });

    expect(categories.map((category) => category.id)).toEqual(['content', 'other']);
    expect(categories[0]?.tags).toEqual(['ui']);
    expect(categories[1]?.tags).toEqual(['custom-mod-tag']);
  });
});

describe('buildRegistryTagCounts', () => {
  it('counts unique tags per item', () => {
    const counts = buildRegistryTagCounts([
      ['ui', 'ui', 'gameplay'],
      ['ui'],
      null,
    ]);

    expect(counts).toEqual({ ui: 2, gameplay: 1 });
  });
});

describe('formatRegistryTagLabel', () => {
  it('formats known map quality and detail values', () => {
    expect(formatRegistryTagLabel('data-quality', 'low-quality')).toBe('Low Data Quality');
    expect(formatRegistryTagLabel('level-of-detail', 'high-detail')).toBe('High Detail');
    expect(formatRegistryTagLabel('other', 'custom')).toBe('custom');
  });
});
