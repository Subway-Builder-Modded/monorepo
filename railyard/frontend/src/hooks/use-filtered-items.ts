import {
  filterAndPaginateTaggedItems,
  filterTaggedItems,
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
import {
  STATUS_FILTER_VALUES,
  type StatusFilter,
} from '@/stores/status-filter-slice';

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

function matchesBrowseStatus(
  entry: TaggedItem,
  status: StatusFilter,
  incompatibleItemKeys: ReadonlySet<string> | undefined,
): boolean {
  const isIncompatible =
    incompatibleItemKeys?.has(assetKey(entry.type, entry.item.id)) ?? false;
  if (status === 'compatible') return !isIncompatible;
  if (status === 'incompatible') return isIncompatible;
  if (status === 'test') return entry.item.is_test === true;
  // 'local' never applies to registry listings.
  return false;
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

  // Status is a type-scoped facet: it only constrains the browsed type. Items of the
  // other type pass through so its type/dim counts stay independent of the status
  // selection (which setType clears on switch anyway).
  const allItems = useMemo(() => {
    if (statusFilters.length === 0) return registryItems;
    return registryItems.filter(
      (entry) =>
        entry.type !== filters.type ||
        statusFilters.some((sf) =>
          matchesBrowseStatus(entry, sf, incompatibleItemKeys),
        ),
    );
  }, [filters.type, incompatibleItemKeys, registryItems, statusFilters]);
  const accessors = useMemo(
    () => createTaggedListingAccessors<TaggedItem>(),
    [],
  );
  const countFilters = useMemo(
    () => (filters.query ? { ...filters, query: '' } : filters),
    [filters],
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

  // Status facet counts: every other facet applies (type, tags, map dims), but not the
  // status selection itself, and — per the countFilters convention — not the query.
  const statusCounts = useMemo(
    () =>
      measureSync('browse.statusCounts', () => {
        const facetItems = filterTaggedItems({
          items: registryItems,
          filters: countFilters,
          accessors,
        });
        const counts: Record<StatusFilter, number> = {
          compatible: 0,
          test: 0,
          local: 0,
          incompatible: 0,
        };
        for (const entry of facetItems) {
          for (const status of STATUS_FILTER_VALUES) {
            if (matchesBrowseStatus(entry, status, incompatibleItemKeys)) {
              counts[status] += 1;
            }
          }
        }
        return counts;
      }),
    [accessors, countFilters, incompatibleItemKeys, registryItems],
  );

  // Measured (sync); this fully filters + sorts the registry.and should be cheap — the real cost
  // is rendering the resulting cards, which is why the output is deferred below.
  const filteredPage = useMemo(
    () =>
      measureSync('browse.filterAndPaginate', () =>
        filterAndPaginateTaggedItems({
          items: allItems,
          page,
          filters,
          modDownloadTotals,
          mapDownloadTotals,
          compareItems,
          accessors,
        }),
      ),
    [accessors, allItems, filters, mapDownloadTotals, modDownloadTotals, page],
  );

  // Render the list from a DEFERRED copy: a filter/page change updates the controls and sidebar
  // counts immediately, while the heavy card-grid re-render runs at low priority so it never blocks the main thread with a long freeze.
  const deferredFilteredPage = useDeferredValue(filteredPage);

  return {
    items: deferredFilteredPage.items,
    page: deferredFilteredPage.page,
    totalPages: deferredFilteredPage.totalPages,
    totalResults: deferredFilteredPage.totalResults,
    filters,
    setFilters,
    setType,
    setPage,
    dimCounts,
    statusCounts,
  };
}
