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
      availableTags: ['schools', 'west-europe', 'high', 'custom-tag'],
    });

    expect(categories.map((category) => category.id)).toEqual([
      'regions',
      'data-quality',
      'special-demand',
      'other',
    ]);
    expect(categories[0]?.tags).toEqual(['west-europe']);
    expect(categories[1]?.tags).toEqual(['high']);
    expect(categories[2]?.tags).toEqual(['schools']);
    expect(categories[3]?.tags).toEqual(['custom-tag']);
  });

  it('includes map quality values present in manifest fields', () => {
    const categories = buildRegistryTagCategories({
      typeId: 'maps',
      availableTags: ['north-america'],
      mapDataQualityValues: ['medium'],
    });

    const qualityCategory = categories.find((category) => category.id === 'data-quality');

    expect(qualityCategory?.tags).toEqual(['medium']);
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
  it('formats known map quality values', () => {
    expect(formatRegistryTagLabel('data-quality', 'very-high')).toBe('very-high-quality');
    expect(formatRegistryTagLabel('data-quality', 'high')).toBe('high-quality');
    expect(formatRegistryTagLabel('data-quality', 'unknown')).toBe('unknown-quality');
    expect(formatRegistryTagLabel('other', 'custom')).toBe('custom');
  });
});
