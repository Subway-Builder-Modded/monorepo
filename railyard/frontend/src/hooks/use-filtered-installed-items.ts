import {
  filterAndSortTaggedItems,
  filterTaggedItems,
} from '@subway-builder-modded/asset-listings-state';
import {
  ASSET_LISTING_FUSE_SEARCH_OPTIONS,
  type PerPage,
} from '@subway-builder-modded/config';
import { useMemo } from 'react';

import { type TaggedItemFilterState } from '@/hooks/use-filtered-items';
import { useGameVersion } from '@/hooks/use-game-version';
import { usePaginationSync } from '@/hooks/use-pagination-sync';
import { compareItems } from '@/lib/tagged-items';
import {
  buildDimensionCounts,
  createTaggedListingAccessors,
} from '@/lib/tagged-listing-filters';
import { isInstalledCompatible } from '@/lib/version-compatibility';
import { type StatusFilter, useLibraryStore } from '@/stores/library-store';
import { useProfileStore } from '@/stores/profile-store';
import { STATUS_FILTER_VALUES } from '@/stores/status-filter-slice';

import type { types } from '../../wailsjs/go/models';

export type InstalledTaggedItem =
  | {
      type: 'mod';
      item: types.ModManifest;
      installedVersion: string;
      installedSizeBytes: number;
      isLocal: boolean;
      constraints?: types.InstalledConstraint[];
    }
  | {
      type: 'map';
      item: types.MapManifest;
      installedVersion: string;
      installedSizeBytes: number;
      isLocal: boolean;
      constraints?: types.InstalledConstraint[];
    };

interface UseFilteredInstalledParams {
  items: InstalledTaggedItem[];
  modDownloadTotals: Record<string, number>;
  mapDownloadTotals: Record<string, number>;
}

function itemStatusRank(
  item: InstalledTaggedItem,
  gameVersion: string,
): number {
  if (isInstalledCompatible(gameVersion, item.constraints ?? []) === false)
    return 3;
  if (!item.isLocal && item.item.is_test === true) return 2;
  if (item.isLocal) return 1;
  return 0;
}

function matchesStatusFilter(
  item: InstalledTaggedItem,
  sf: StatusFilter,
  gameVersion: string,
): boolean {
  if (sf === 'local') return item.isLocal;
  if (sf === 'incompatible')
    return isInstalledCompatible(gameVersion, item.constraints ?? []) === false;
  if (sf === 'compatible')
    return isInstalledCompatible(gameVersion, item.constraints ?? []) !== false;
  if (sf === 'test') return !item.isLocal && item.item.is_test === true;
  return false;
}

// Counts how many items match each status. Statuses overlap: 'compatible' means
// "not incompatible", so local and test items also count as compatible.
export function countInstalledStatuses(
  items: readonly InstalledTaggedItem[],
  gameVersion: string,
): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = {
    compatible: 0,
    test: 0,
    local: 0,
    incompatible: 0,
  };
  for (const item of items) {
    for (const status of STATUS_FILTER_VALUES) {
      if (matchesStatusFilter(item, status, gameVersion)) {
        counts[status] += 1;
      }
    }
  }
  return counts;
}

export function isInstalledItemVisibleByStatus(
  item: InstalledTaggedItem,
  statusFilters: readonly StatusFilter[],
  gameVersion: string,
): boolean {
  if (statusFilters.length === 0) return true;
  return statusFilters.some((sf) => matchesStatusFilter(item, sf, gameVersion));
}

export function useFilteredInstalledItems({
  items,
  modDownloadTotals,
  mapDownloadTotals,
}: UseFilteredInstalledParams) {
  const defaultPerPage = useProfileStore((s) => s.defaultPerPage)() as PerPage;
  const filters = useLibraryStore((s) => s.filters);
  const setFilters = useLibraryStore((s) => s.setFilters);
  const setType = useLibraryStore((s) => s.setType);
  const page = useLibraryStore((s) => s.page);
  const setPage = useLibraryStore((s) => s.setPage);
  const statusFilters = useLibraryStore((s) => s.statusFilters);
  const gameVersion = useGameVersion();
  const accessors = useMemo(
    () => createTaggedListingAccessors<InstalledTaggedItem>(),
    [],
  );
  const countFilters = useMemo(
    () => (filters.query ? { ...filters, query: '' } : filters),
    [filters],
  );

  usePaginationSync({ defaultPerPage, filters, setFilters, setPage });

  // Status filter applied up front (it depends on runtime game version) so both the
  // listing and the dimension counts reflect the active status selection. Status is a
  // type-scoped facet: items of the other type pass through so its type/dim counts stay
  // independent of the status selection (which setType clears on switch anyway).
  const statusScopedItems = useMemo(
    () =>
      statusFilters.length === 0
        ? items
        : items.filter(
            (item) =>
              item.type !== filters.type ||
              isInstalledItemVisibleByStatus(item, statusFilters, gameVersion),
          ),
    [filters.type, gameVersion, items, statusFilters],
  );

  const dimCounts = useMemo(
    () =>
      buildDimensionCounts({
        items: statusScopedItems,
        filters: countFilters as TaggedItemFilterState,
        accessors,
      }),
    [accessors, countFilters, statusScopedItems],
  );

  // Status facet counts: every other facet applies (type, tags, map dims), but not the
  // status selection itself, and — per the countFilters convention — not the query.
  const statusCounts = useMemo(
    () =>
      countInstalledStatuses(
        filterTaggedItems({
          items,
          filters: countFilters as TaggedItemFilterState,
          accessors,
          fuseOptions: ASSET_LISTING_FUSE_SEARCH_OPTIONS,
        }),
        gameVersion,
      ),
    [accessors, countFilters, gameVersion, items],
  );

  const filtered = useMemo(() => {
    const result = filterAndSortTaggedItems({
      items: statusScopedItems,
      filters,
      modDownloadTotals,
      mapDownloadTotals,
      compareItems: (left, right, sort, nextModTotals, nextMapTotals) =>
        compareItems(left, right, sort, nextModTotals, nextMapTotals),
      fuseOptions: ASSET_LISTING_FUSE_SEARCH_OPTIONS,
      accessors,
    });

    const numericalSort: Partial<
      Record<string, (i: InstalledTaggedItem) => number>
    > = {
      size: (i) => i.installedSizeBytes ?? 0,
      status: (i) => itemStatusRank(i, gameVersion),
    };
    const getSortValue = numericalSort[filters.sort.field];
    if (getSortValue) {
      const dir = filters.sort.direction;
      return [...result].sort((a, b) => {
        const va = getSortValue(a as InstalledTaggedItem);
        const vb = getSortValue(b as InstalledTaggedItem);
        return dir === 'asc' ? va - vb : vb - va;
      });
    }

    return result;
  }, [
    accessors,
    statusScopedItems,
    filters,
    mapDownloadTotals,
    modDownloadTotals,
    gameVersion,
  ]);

  const totalResults = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / filters.perPage));

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * filters.perPage;
    return filtered.slice(start, start + filters.perPage);
  }, [filtered, page, filters.perPage]);

  return {
    items: paginatedItems,
    allFilteredItems: filtered,
    page,
    totalPages,
    totalResults,
    filters,
    setFilters,
    setType,
    setPage,
    dimCounts,
    statusCounts,
  };
}
