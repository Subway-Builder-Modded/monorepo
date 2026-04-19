import {
  filterAndPaginateTaggedItems,
  type SourceAssetQueryFilterState,
} from '@subway-builder-modded/asset-listings-state';
import { type PerPage } from '@subway-builder-modded/config';
import { useDeferredValue, useMemo } from 'react';

import { usePaginationSync } from '@/hooks/use-pagination-sync';
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
}: UseFilteredItemsParams) {
  const defaultPerPage = useProfileStore((s) => s.defaultPerPage)() as PerPage;
  const filters = useBrowseStore((s) => s.filters);
  const setFilters = useBrowseStore((s) => s.setFilters);
  const setType = useBrowseStore((s) => s.setType);
  const page = useBrowseStore((s) => s.page);
  const setPage = useBrowseStore((s) => s.setPage);

  usePaginationSync({ defaultPerPage, filters, setFilters, setPage });

  const allItems = useMemo<TaggedItem[]>(
    () => buildTaggedItems(mods, maps),
    [mods, maps],
  );
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

  const dimCounts = useMemo(
    () =>
      buildDimensionCounts({
        items: allItems,
        filters: deferredFilters,
        accessors,
      }),
    [accessors, allItems, deferredFilters],
  );

  const filteredPage = useMemo(
    () =>
      filterAndPaginateTaggedItems({
        items: allItems,
        page,
        filters: deferredFilters,
        modDownloadTotals,
        mapDownloadTotals,
        compareItems,
        accessors,
      }),
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
