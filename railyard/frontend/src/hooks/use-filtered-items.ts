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
  type ListingStatusFilter,
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
  // Retirement is a visibility class, not a status: statuses compose freely
  // within the selected class (a test item with no compatible version
  // matches both Test and Incompatible).
  if (status === 'compatible') return !isIncompatible;
  if (status === 'incompatible') return isIncompatible;
  if (status === 'test') return entry.item.is_test === true;
  // 'local' never applies to registry listings; 'deprecated'/'deleted' are
  // visibility classes handled by matchesVisibility.
  return false;
}

/** listingStatusOf classifies a registry listing's lifecycle state. */
export function listingStatusOf(entry: TaggedItem): ListingStatusFilter {
  if (entry.item.deprecation == null) return 'active';
  return entry.item.deprecation.deleted === true ? 'deleted' : 'deprecated';
}

/** matchesListingStatus reports whether an item falls in the selected union
 * of listing-status classes (never empty — see createListingStatusSlice). */
export function matchesListingStatus(
  entry: TaggedItem,
  selected: readonly ListingStatusFilter[],
): boolean {
  return selected.includes(listingStatusOf(entry));
}

// Status counts are scoped to the selected listing-status union and compose
// freely within it: with Deprecated selected, a test listing whose every
// version is game-incompatible counts under both Test and Incompatible.
export function computeBrowseStatusCounts(
  facetItems: readonly TaggedItem[],
  listingStatuses: readonly ListingStatusFilter[],
  incompatibleItemKeys: ReadonlySet<string> | undefined,
): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = {
    compatible: 0,
    test: 0,
    incompatible: 0,
  };
  for (const entry of facetItems) {
    if (!matchesListingStatus(entry, listingStatuses)) continue;
    for (const status of STATUS_FILTER_VALUES) {
      if (matchesBrowseStatus(entry, status, incompatibleItemKeys)) {
        counts[status] += 1;
      }
    }
  }
  return counts;
}

// Listing-status counts for the browsed type, independent of the current
// selection so every class advertises its size. 'local' never applies to
// registry listings (Library computes its own counts).
export function computeListingStatusCounts(
  facetItems: readonly TaggedItem[],
  browsedType: 'mod' | 'map',
): Record<ListingStatusFilter, number> {
  const counts: Record<ListingStatusFilter, number> = {
    active: 0,
    deprecated: 0,
    deleted: 0,
    local: 0,
  };
  for (const entry of facetItems) {
    if (entry.type !== browsedType) continue;
    counts[listingStatusOf(entry)] += 1;
  }
  return counts;
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
  const listingStatuses = useBrowseStore((s) => s.listingStatuses);

  usePaginationSync({ defaultPerPage, filters, setFilters, setPage });

  const registryItems = useMemo<TaggedItem[]>(
    () => buildTaggedItems(mods, maps),
    [mods, maps],
  );

  // Listing status is a composable union (mirroring the website): the
  // selection is never empty and defaults to Active alone. Retired items of
  // the OTHER type are always excluded so the type-count badges match what a
  // type switch (which resets the selection) will actually show.
  const visibleItems = useMemo(
    () =>
      registryItems.filter((entry) => {
        if (entry.type !== filters.type) return entry.item.deprecation == null;
        return matchesListingStatus(entry, listingStatuses);
      }),
    [filters.type, registryItems, listingStatuses],
  );

  // Status is a type-scoped facet: it only constrains the browsed type. Items of the
  // other type pass through so its type/dim counts stay independent of the status
  // selection (which setType clears on switch anyway).
  const allItems = useMemo(() => {
    if (statusFilters.length === 0) return visibleItems;
    return visibleItems.filter(
      (entry) =>
        entry.type !== filters.type ||
        statusFilters.some((sf) =>
          matchesBrowseStatus(entry, sf, incompatibleItemKeys),
        ),
    );
  }, [filters.type, incompatibleItemKeys, visibleItems, statusFilters]);
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
      measureSync('browse.statusCounts', () =>
        computeBrowseStatusCounts(
          filterTaggedItems({
            items: registryItems,
            filters: countFilters,
            accessors,
          }),
          listingStatuses,
          incompatibleItemKeys,
        ),
      ),
    [
      accessors,
      countFilters,
      incompatibleItemKeys,
      listingStatuses,
      registryItems,
    ],
  );

  const listingStatusCounts = useMemo(
    () =>
      computeListingStatusCounts(
        filterTaggedItems({
          items: registryItems,
          filters: countFilters,
          accessors,
        }),
        filters.type,
      ),
    [accessors, countFilters, filters.type, registryItems],
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
    listingStatuses,
    listingStatusCounts,
  };
}
