'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  buildAssetSearchText,
  createDefaultSourceFilters,
  createSourceFilterByAssetType,
  filterAndPaginateTaggedItems,
  type SourceAssetFilterState,
  type SourceAssetQueryFilterState,
  type SourceFilterByAssetType,
} from '@subway-builder-modded/asset-listings-state';
import type { AssetType } from '@subway-builder-modded/config';
import {
  PER_PAGE_OPTIONS,
  type PerPage,
  type SortState,
} from '@subway-builder-modded/config';
import {
  cloneFilterState,
  createRandomSeed,
  toAssetFilterState,
} from '@subway-builder-modded/stores-core';
import {
  buildTaggedItems,
  compareItems,
  type TaggedItem,
} from '@/lib/railyard/tagged-items';
import type { MapManifest, ModManifest } from '@/types/registry';

export type { TaggedItem };

const BROWSE_STATE_STORAGE_KEY = 'railyard:browse:state:v1';

export type SearchFilterState = SourceAssetQueryFilterState;
type AssetFilterState = SourceAssetFilterState;
type FilterByAssetType = SourceFilterByAssetType;

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

function createDefaultFilters(type: AssetType = 'map'): SearchFilterState {
  return createDefaultSourceFilters(type);
}

function buildSearchText(item: TaggedItem): string {
  return buildAssetSearchText(item, (entry) => entry.author ?? '');
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
      sourceQuality: Array.isArray(rawMap?.sourceQuality)
        ? [...(rawMap.sourceQuality as string[])]
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
        sourceQuality: Array.isArray(parsed.filters.map?.sourceQuality)
          ? parsed.filters.map.sourceQuality
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

    const fallbackScopedByType = createSourceFilterByAssetType(filters, page);
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
    scopedByType: createSourceFilterByAssetType(filters, 1),
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

  const filteredPage = useMemo(
    () =>
      filterAndPaginateTaggedItems({
        items: allItems,
        page: requestedPage,
        filters,
        modDownloadTotals,
        mapDownloadTotals,
        compareItems,
        accessors: {
          buildSearchText,
          getModTags: (item) =>
            item.type === 'mod' ? (item.item.tags ?? []) : undefined,
          getMapLocation: (item) =>
            item.type === 'map' ? (item.item.location ?? '') : undefined,
          getMapQuality: (item) =>
            item.type === 'map' ? (item.item.source_quality ?? '') : undefined,
          getSelectedMapQuality: (mapFilters) => mapFilters.sourceQuality,
          getMapLevelOfDetail: (item) =>
            item.type === 'map' ? (item.item.level_of_detail ?? '') : undefined,
          getSelectedMapLevelOfDetail: (mapFilters) => mapFilters.levelOfDetail,
          getMapSpecialDemand: (item) =>
            item.type === 'map' ? (item.item.special_demand ?? []) : undefined,
          getSelectedMapSpecialDemand: (mapFilters) => mapFilters.specialDemand,
          getSelectedMapLocations: (mapFilters) => mapFilters.locations,
        },
      }),
    [allItems, filters, mapDownloadTotals, modDownloadTotals, requestedPage],
  );

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
            sourceQuality: [...targetState.map.sourceQuality],
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
    items: filteredPage.items,
    page: filteredPage.page,
    totalPages: filteredPage.totalPages,
    totalResults: filteredPage.totalResults,
    filters,
    setFilters,
    setType,
    setPage,
  };
}
