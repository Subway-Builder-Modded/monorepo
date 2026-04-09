import Fuse from 'fuse.js';

import { FUSE_SEARCH_OPTIONS } from '@sbm/core/railyard/lib/search';
import {
  compareItems,
  type TaggedItem,
} from '@sbm/core/railyard/lib/tagged-items';

import type { MapManifest } from '../types/manifest';
import { type SortState } from '../lib/constants';

type SearchableItem = {
  entry: TaggedItem;
  searchText: string;
};

export interface TaggedItemFilterState {
  query: string;
  type: 'mod' | 'map';
  sort: SortState;
  randomSeed: number;
  mod: {
    tags: string[];
  };
  map: {
    locations: string[];
    sourceQuality: string[];
    levelOfDetail: string[];
    specialDemand: string[];
  };
}

export function buildSearchText(item: TaggedItem): string {
  const base = item.item;
  const values: string[] = [base.name ?? '', base.author.author_alias];

  if (item.type === 'map') {
    const map = base as MapManifest;
    values.push(map.city_code ?? '', map.country ?? '');
  }

  return values.filter(Boolean).join(' ');
}

export function matchesSingleValueFilter(
  value: string | undefined,
  selected: string[],
): boolean {
  if (selected.length === 0) return true;
  if (!value) return false;
  return selected.includes(value);
}

export function matchesZeroOrManyValuesFilter(
  values: string[] | undefined,
  selected: string[],
): boolean {
  if (selected.length === 0) return true;
  if (!values || values.length === 0) return false;
  return selected.some((tag) => values.includes(tag));
}

export function matchesMapAttributeFilters(
  item: TaggedItem,
  filters: TaggedItemFilterState['map'],
): boolean {
  if (item.type !== 'map') return true;

  const map = item.item as MapManifest;
  return (
    matchesSingleValueFilter(map.location, filters.locations) &&
    matchesSingleValueFilter(map.source_quality, filters.sourceQuality) &&
    matchesSingleValueFilter(map.level_of_detail, filters.levelOfDetail) &&
    matchesZeroOrManyValuesFilter(map.special_demand, filters.specialDemand)
  );
}

export function seededHash(value: string, seed: number): number {
  const FNV_OFFSET_BASIS_32 = 0x811c9dc5;
  const FNV_PRIME_32 = 0x01000193;

  let hash = (seed ^ FNV_OFFSET_BASIS_32) >>> 0;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME_32) >>> 0;
  }
  return hash;
}

export function sortItemsBySeed(
  items: TaggedItem[],
  seed: number,
): TaggedItem[] {
  return [...items].sort((a, b) => {
    const hashA = seededHash(`${a.type}:${a.item.id}`, seed);
    const hashB = seededHash(`${b.type}:${b.item.id}`, seed);
    if (hashA !== hashB) {
      return hashA - hashB;
    }
    return a.item.id.localeCompare(b.item.id);
  });
}

export function filterAndSortTaggedItems<T extends TaggedItem>(
  items: T[],
  filters: TaggedItemFilterState,
  modDownloadTotals: Record<string, number>,
  mapDownloadTotals: Record<string, number>,
): T[] {
  let result = items.filter((i) => i.type === filters.type);

  if (filters.mod.tags.length > 0) {
    result = result.filter((i) =>
      i.type === 'mod'
        ? matchesZeroOrManyValuesFilter(i.item.tags, filters.mod.tags)
        : true,
    );
  }

  result = result.filter((i) => matchesMapAttributeFilters(i, filters.map));
  const query = filters.query.trim();
  if (query) {
    const searchable: SearchableItem[] = result.map((entry) => ({
      entry,
      searchText: buildSearchText(entry),
    }));

    const fuse = new Fuse(searchable, FUSE_SEARCH_OPTIONS);

    result = fuse.search(query).map(({ item }) => item.entry as T);
  }

  if (filters.sort.field === 'random') {
    return sortItemsBySeed(result, filters.randomSeed) as T[];
  }

  return [...result].sort((a, b) =>
    compareItems(a, b, filters.sort, modDownloadTotals, mapDownloadTotals),
  );
}


