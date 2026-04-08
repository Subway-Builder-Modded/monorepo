'use client';

import Fuse from 'fuse.js';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AssetType } from '@/lib/railyard/asset-types';
import {
  DEFAULT_SORT_STATE,
  PER_PAGE_OPTIONS,
  type PerPage,
  type SortState,
} from '@/lib/railyard/constants';
import { FUSE_SEARCH_OPTIONS } from '@/lib/railyard/search';
import {
  buildTaggedItems,
  compareItems,
  type TaggedItem,
} from '@/lib/railyard/tagged-items';
import type { MapManifest, ModManifest } from '@/types/registry';

export type { TaggedItem };
export { PER_PAGE_OPTIONS };

const BROWSE_STATE_STORAGE_KEY = 'railyard:browse:state:v1';

export interface SearchFilterState {
  query: string;
  type: AssetType;
  sort: SortState;
  randomSeed: number;
  perPage: PerPage;
  mod: {
    tags: string[];
  };
  map: {
    locations: string[];
    dataQuality: string[];
    levelOfDetail: string[];
    specialDemand: string[];
  };
}

interface AssetFilterState {
  sort: SortState;
  randomSeed: number;
  page: number;
  mod: {
    tags: string[];
  };
  map: {
    locations: string[];
    dataQuality: string[];
    levelOfDetail: string[];
    specialDemand: string[];
  };
}

type FilterByAssetType = Record<AssetType, AssetFilterState>;

interface PersistedBrowseState {
  filters: SearchFilterState;
  page: number;
  scopedByType: FilterByAssetType;
}

interface UseFilteredItemsParams {
  mods: ModManifest[];
  maps: MapManifest[];
  modDownloadTotals: Record<string, number>;
  mapDownloadTotals: Record<string, number>;
  initialType?: AssetType;
}

export type SearchFilterUpdater =
  | SearchFilterState
  | ((prev: SearchFilterState) => SearchFilterState);

type SearchableItem = {
  entry: TaggedItem;
  searchText: string;
};

export function createRandomSeed(): number {
  return Math.floor(Math.random() * 2_147_483_647);
}

function createDefaultFilters(type: AssetType = 'map'): SearchFilterState {
  return {
    query: '',
    type,
    sort: DEFAULT_SORT_STATE,
    randomSeed: createRandomSeed(),
    perPage: 12,
    mod: {
      tags: [],
    },
    map: {
      locations: [],
      dataQuality: [],
      levelOfDetail: [],
      specialDemand: [],
    },
  };
}

function cloneFilterState(state: SearchFilterState): SearchFilterState {
  return {
    ...state,
    sort: { ...state.sort },
    mod: {
      tags: [...state.mod.tags],
    },
    map: {
      locations: [...state.map.locations],
      dataQuality: [...state.map.dataQuality],
      levelOfDetail: [...state.map.levelOfDetail],
      specialDemand: [...state.map.specialDemand],
    },
  };
}

function toAssetFilterState(
  state: SearchFilterState,
  page: number,
): AssetFilterState {
  return {
    sort: { ...state.sort },
    randomSeed: state.randomSeed,
    page,
    mod: {
      tags: [...state.mod.tags],
    },
    map: {
      locations: [...state.map.locations],
      dataQuality: [...state.map.dataQuality],
      levelOfDetail: [...state.map.levelOfDetail],
      specialDemand: [...state.map.specialDemand],
    },
  };
}

function createFilterByAssetType(
  state: SearchFilterState,
  page: number,
): FilterByAssetType {
  return {
    mod: toAssetFilterState(state, page),
    map: toAssetFilterState(state, page),
  };
}

function buildSearchText(item: TaggedItem): string {
  const base = item.item;
  const values: string[] = [
    base.name ?? '',
    base.author ?? '',
    base.description ?? '',
  ];

  if (item.type === 'mod') {
    values.push(...(base.tags ?? []));
  } else {
    values.push(
      item.item.city_code ?? '',
      item.item.country ?? '',
      item.item.location ?? '',
      item.item.source_quality ?? '',
      item.item.level_of_detail ?? '',
      ...(item.item.special_demand ?? []),
    );
  }

  return values.filter(Boolean).join(' ');
}

function matchesSingleValueFilter(
  value: string | undefined,
  selected: string[],
): boolean {
  if (selected.length === 0) return true;
  if (!value) return false;
  return selected.includes(value);
}

function matchesZeroOrManyValuesFilter(
  values: string[] | undefined,
  selected: string[],
): boolean {
  if (selected.length === 0) return true;
  if (!values || values.length === 0) return false;
  return selected.some((tag) => values.includes(tag));
}

function matchesMapAttributeFilters(
  item: TaggedItem,
  filters: SearchFilterState['map'],
): boolean {
  if (item.type !== 'map') return true;

  return (
    matchesSingleValueFilter(item.item.location, filters.locations) &&
    matchesSingleValueFilter(item.item.source_quality, filters.dataQuality) &&
    matchesSingleValueFilter(
      item.item.level_of_detail,
      filters.levelOfDetail,
    ) &&
    matchesZeroOrManyValuesFilter(
      item.item.special_demand,
      filters.specialDemand,
    )
  );
}

function seededHash(value: string, seed: number): number {
  const FNV_OFFSET_BASIS_32 = 0x811c9dc5;
  const FNV_PRIME_32 = 0x01000193;

  let hash = (seed ^ FNV_OFFSET_BASIS_32) >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME_32) >>> 0;
  }
  return hash;
}

function sortItemsBySeed(items: TaggedItem[], seed: number): TaggedItem[] {
  return [...items].sort((left, right) => {
    const leftHash = seededHash(`${left.type}:${left.item.id}`, seed);
    const rightHash = seededHash(`${right.type}:${right.item.id}`, seed);
    if (leftHash !== rightHash) {
      return leftHash - rightHash;
    }
    return left.item.id.localeCompare(right.item.id);
  });
}

function filterAndSortTaggedItems(
  items: TaggedItem[],
  filters: SearchFilterState,
  modDownloadTotals: Record<string, number>,
  mapDownloadTotals: Record<string, number>,
): TaggedItem[] {
  let result = items.filter((item) => item.type === filters.type);

  if (filters.mod.tags.length > 0) {
    result = result.filter((item) =>
      item.type === 'mod'
        ? matchesZeroOrManyValuesFilter(item.item.tags, filters.mod.tags)
        : true,
    );
  }

  result = result.filter((item) =>
    matchesMapAttributeFilters(item, filters.map),
  );

  const query = filters.query.trim();
  if (query) {
    const searchable: SearchableItem[] = result.map((entry) => ({
      entry,
      searchText: buildSearchText(entry),
    }));

    const fuse = new Fuse(searchable, FUSE_SEARCH_OPTIONS);
    result = fuse.search(query).map(({ item }) => item.entry);
  }

  if (filters.sort.field === 'random') {
    return sortItemsBySeed(result, filters.randomSeed);
  }

  return [...result].sort((left, right) =>
    compareItems(
      left,
      right,
      filters.sort,
      modDownloadTotals,
      mapDownloadTotals,
    ),
  );
}

function normalizePerPage(value: unknown): PerPage {
  return PER_PAGE_OPTIONS.includes(value as PerPage) ? (value as PerPage) : 12;
}

function normalizeAssetFilterState(
  raw: unknown,
  fallback: AssetFilterState,
): AssetFilterState {
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Record<string, unknown>;
  const rawMod = r.mod as Record<string, unknown> | undefined;
  const rawMap = r.map as Record<string, unknown> | undefined;
  return {
    sort:
      r.sort && typeof r.sort === 'object'
        ? { ...(r.sort as SortState) }
        : { ...fallback.sort },
    randomSeed:
      typeof r.randomSeed === 'number' ? r.randomSeed : fallback.randomSeed,
    page:
      typeof r.page === 'number' && Number.isFinite(r.page) && r.page > 0
        ? Math.floor(r.page)
        : fallback.page,
    mod: {
      tags: Array.isArray(rawMod?.tags) ? [...(rawMod.tags as string[])] : [],
    },
    map: {
      locations: Array.isArray(rawMap?.locations)
        ? [...(rawMap.locations as string[])]
        : [],
      dataQuality: Array.isArray(rawMap?.dataQuality)
        ? [...(rawMap.dataQuality as string[])]
        : [],
      levelOfDetail: Array.isArray(rawMap?.levelOfDetail)
        ? [...(rawMap.levelOfDetail as string[])]
        : [],
      specialDemand: Array.isArray(rawMap?.specialDemand)
        ? [...(rawMap.specialDemand as string[])]
        : [],
    },
  };
}

function parsePersistedState(
  raw: string | null,
  initialType?: AssetType,
): PersistedBrowseState | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PersistedBrowseState;
    if (!parsed?.filters) return null;

    const fallback = createDefaultFilters(initialType);
    const filters: SearchFilterState = {
      ...fallback,
      ...parsed.filters,
      type:
        parsed.filters.type === 'mod' || parsed.filters.type === 'map'
          ? parsed.filters.type
          : fallback.type,
      sort: parsed.filters.sort ?? fallback.sort,
      perPage: normalizePerPage(parsed.filters.perPage),
      mod: {
        tags: Array.isArray(parsed.filters.mod?.tags)
          ? parsed.filters.mod.tags
          : [],
      },
      map: {
        locations: Array.isArray(parsed.filters.map?.locations)
          ? parsed.filters.map.locations
          : [],
        dataQuality: Array.isArray(parsed.filters.map?.dataQuality)
          ? parsed.filters.map.dataQuality
          : [],
        levelOfDetail: Array.isArray(parsed.filters.map?.levelOfDetail)
          ? parsed.filters.map.levelOfDetail
          : [],
        specialDemand: Array.isArray(parsed.filters.map?.specialDemand)
          ? parsed.filters.map.specialDemand
          : [],
      },
      randomSeed:
        typeof parsed.filters.randomSeed === 'number'
          ? parsed.filters.randomSeed
          : createRandomSeed(),
      query:
        typeof parsed.filters.query === 'string' ? parsed.filters.query : '',
    };

    const page =
      typeof parsed.page === 'number' &&
      Number.isFinite(parsed.page) &&
      parsed.page > 0
        ? Math.floor(parsed.page)
        : 1;

    const fallbackScopedByType = createFilterByAssetType(filters, page);
    const scopedByType: FilterByAssetType = {
      mod: normalizeAssetFilterState(
        parsed.scopedByType?.mod,
        fallbackScopedByType.mod,
      ),
      map: normalizeAssetFilterState(
        parsed.scopedByType?.map,
        fallbackScopedByType.map,
      ),
    };
    return {
      filters,
      page,
      scopedByType,
    };
  } catch {
    return null;
  }
}

function getInitialState(initialType?: AssetType): PersistedBrowseState {
  if (typeof window !== 'undefined') {
    const persisted = parsePersistedState(
      window.localStorage.getItem(BROWSE_STATE_STORAGE_KEY),
      initialType,
    );
    if (persisted) {
      if (initialType && persisted.filters.type !== initialType) {
        return {
          ...persisted,
          filters: {
            ...persisted.filters,
            type: initialType,
          },
        };
      }
      return persisted;
    }
  }

  const filters = createDefaultFilters(initialType);
  return {
    filters,
    page: 1,
    scopedByType: createFilterByAssetType(filters, 1),
  };
}

export function useFilteredItems({
  mods,
  maps,
  modDownloadTotals,
  mapDownloadTotals,
  initialType,
}: UseFilteredItemsParams) {
  const [initialState] = useState<PersistedBrowseState>(() =>
    getInitialState(initialType),
  );

  const [filters, setFiltersState] = useState<SearchFilterState>(
    cloneFilterState(initialState.filters),
  );
  const [requestedPage, setRequestedPage] = useState<number>(initialState.page);
  const [scopedByType, setScopedByType] = useState<FilterByAssetType>(
    initialState.scopedByType,
  );

  const allItems = useMemo<TaggedItem[]>(
    () => buildTaggedItems(mods, maps),
    [mods, maps],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const payload: PersistedBrowseState = {
      filters,
      page: requestedPage,
      scopedByType,
    };
    window.localStorage.setItem(
      BROWSE_STATE_STORAGE_KEY,
      JSON.stringify(payload),
    );
  }, [filters, requestedPage, scopedByType]);

  const filtered = useMemo(() => {
    return filterAndSortTaggedItems(
      allItems,
      filters,
      modDownloadTotals,
      mapDownloadTotals,
    );
  }, [allItems, filters, mapDownloadTotals, modDownloadTotals]);

  const totalResults = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / filters.perPage));

  const pageCapped = Math.min(requestedPage, totalPages);

  const items = useMemo(() => {
    const start = (pageCapped - 1) * filters.perPage;
    return filtered.slice(start, start + filters.perPage);
  }, [filtered, pageCapped, filters.perPage]);

  const setFilters = useCallback((updater: SearchFilterUpdater) => {
    setFiltersState((previous) => {
      const next = typeof updater === 'function' ? updater(previous) : updater;
      setRequestedPage(1);
      setScopedByType((previousScopedByType) => ({
        ...previousScopedByType,
        [next.type]: toAssetFilterState(next, 1),
      }));
      return next;
    });
  }, []);

  const setType = useCallback(
    (nextType: AssetType) => {
      setScopedByType((previousScopedByType) => {
        const nextScopedByType = {
          ...previousScopedByType,
          [filters.type]: toAssetFilterState(filters, requestedPage),
        };
        const targetState = nextScopedByType[nextType];

        setFiltersState((previous) => ({
          ...previous,
          sort: { ...targetState.sort },
          randomSeed: targetState.randomSeed,
          mod: {
            tags: [...targetState.mod.tags],
          },
          map: {
            locations: [...targetState.map.locations],
            dataQuality: [...targetState.map.dataQuality],
            levelOfDetail: [...targetState.map.levelOfDetail],
            specialDemand: [...targetState.map.specialDemand],
          },
          type: nextType,
        }));
        setRequestedPage(targetState.page);

        return nextScopedByType;
      });
    },
    [filters, requestedPage],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      setRequestedPage(nextPage);
      setScopedByType((previousScopedByType) => ({
        ...previousScopedByType,
        [filters.type]: toAssetFilterState(filters, nextPage),
      }));
    },
    [filters],
  );

  return {
    items,
    page: pageCapped,
    totalPages,
    totalResults,
    filters,
    setFilters,
    setType,
    setPage,
  };
}
