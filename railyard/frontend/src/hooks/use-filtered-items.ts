import {
  filterAndPaginateTaggedItems,
  type SourceAssetQueryFilterState,
} from '@subway-builder-modded/asset-listings-state';
import { type PerPage } from '@subway-builder-modded/config';
import { useDeferredValue, useMemo } from 'react';

import { usePaginationSync } from '@/hooks/use-pagination-sync';
import { assetKey } from '@/lib/asset-key';
import { measureSync } from '@/lib/perf';
import {
  buildTaggedItems,
  compareItems,
  type TaggedItem,
} from '@/lib/tagged-items';
import {
  buildDimensionCounts,
  createTaggedListingAccessors,
} from '@/lib/tagged-listing-filters';
import { type BrowseFilterState, useBrowseStore } from '@/stores/browse-store';
import { useProfileStore } from '@/stores/profile-store';

import type { types } from '../../wailsjs/go/models';

interface UseFilteredItemsParams {
  mods: types.ModManifest[];
  maps: types.MapManifest[];
  modDownloadTotals: Record<string, number>;
  mapDownloadTotals: Record<string, number>;
  incompatibleItemKeys?: ReadonlySet<string>;
}

export interface TaggedItemFilterState {
  query: string;
  type: 'mod' | 'map';
  sort: SourceAssetQueryFilterState['sort'];
  randomSeed: number;
  perPage: PerPage;
  mod: {
    tags: string[];
  };
  map: BrowseFilterState['map'];
}

export function useFilteredItems({
  mods,
  maps,
  modDownloadTotals,
  mapDownloadTotals,
  incompatibleItemKeys,
}: UseFilteredItemsParams) {
  const defaultPerPage = useProfileStore((s) => s.defaultPerPage)() as PerPage;
  const filters = useBrowseStore((s) => s.filters);
  const setFilters = useBrowseStore((s) => s.setFilters);
  const setType = useBrowseStore((s) => s.setType);
  const page = useBrowseStore((s) => s.page);
  const setPage = useBrowseStore((s) => s.setPage);
  const statusFilters = useBrowseStore((s) => s.statusFilters);

  usePaginationSync({ defaultPerPage, filters, setFilters, setPage });

  const registryItems = useMemo<TaggedItem[]>(
    () => buildTaggedItems(mods, maps),
    [mods, maps],
  );

  const allItems = useMemo(() => {
    if (statusFilters.length === 0) return registryItems;
    return registryItems.filter((entry) => {
      const key = assetKey(entry.type, entry.item.id);
      const isIncompatible = incompatibleItemKeys?.has(key) ?? false;
      for (const sf of statusFilters) {
        if (sf === 'compatible' && !isIncompatible) return true;
        if (sf === 'incompatible' && isIncompatible) return true;
        if (sf === 'test' && entry.item.is_test === true) return true;
      }
      return false;
    });
  }, [incompatibleItemKeys, registryItems, statusFilters]);
  const accessors = useMemo(
    () => createTaggedListingAccessors<TaggedItem>(),
    [],
  );
  const deferredQuery = useDeferredValue(filters.query);
  const deferredFilters = useMemo(
    () =>
      deferredQuery === filters.query
        ? filters
        : { ...filters, query: deferredQuery },
    [deferredQuery, filters],
  );
  const countFilters = useMemo(
    () =>
      deferredFilters.query
        ? { ...deferredFilters, query: '' }
        : deferredFilters,
    [deferredFilters],
  );

  // Measured (sync); this runs multiple filter passes over the registry.
  const dimCounts = useMemo(
    () =>
      measureSync('browse.dimCounts', () =>
        buildDimensionCounts({
          items: allItems,
          filters: countFilters,
          accessors,
        }),
      ),
    [accessors, allItems, countFilters],
  );

  // Measured (sync); this fully filters + sorts the registry (and may rebuild a Fuse
  // index) on every filter/page change.
  const filteredPage = useMemo(
    () =>
      measureSync('browse.filterAndPaginate', () =>
        filterAndPaginateTaggedItems({
          items: allItems,
          page,
          filters: deferredFilters,
          modDownloadTotals,
          mapDownloadTotals,
          compareItems,
          accessors,
        }),
      ),
    [
      accessors,
      allItems,
      deferredFilters,
      mapDownloadTotals,
      modDownloadTotals,
      page,
    ],
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
    dimCounts,
  };
}
