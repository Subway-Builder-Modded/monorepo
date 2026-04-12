import { filterAndSortTaggedItems } from '@subway-builder-modded/asset-listings-state';
import {
  ASSET_LISTING_FUSE_SEARCH_OPTIONS,
  type PerPage,
} from '@subway-builder-modded/config';
import { useMemo } from 'react';

import {
  buildSearchText,
  type TaggedItemFilterState,
} from '@/hooks/use-filtered-items';
import { usePaginationSync } from '@/hooks/use-pagination-sync';
import { compareItems } from '@/lib/tagged-items';
import { useLibraryStore } from '@/stores/library-store';
import { useProfileStore } from '@/stores/profile-store';

import type { types } from '../../wailsjs/go/models';

export type InstalledTaggedItem =
  | {
      type: 'mod';
      item: types.ModManifest;
      installedVersion: string;
      installedSizeBytes: number;
      isLocal: boolean;
    }
  | {
      type: 'map';
      item: types.MapManifest;
      installedVersion: string;
      installedSizeBytes: number;
      isLocal: boolean;
    };

interface UseFilteredInstalledParams {
  items: InstalledTaggedItem[];
  modDownloadTotals: Record<string, number>;
  mapDownloadTotals: Record<string, number>;
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

  usePaginationSync({ defaultPerPage, filters, setFilters, setPage });

  const filtered = useMemo(() => {
    const result = filterAndSortTaggedItems({
      items,
      filters: filters as TaggedItemFilterState,
      modDownloadTotals,
      mapDownloadTotals,
      compareItems: (left, right, sort, nextModTotals, nextMapTotals) =>
        compareItems(
          left,
          right,
          sort as TaggedItemFilterState['sort'],
          nextModTotals,
          nextMapTotals,
        ),
      fuseOptions: ASSET_LISTING_FUSE_SEARCH_OPTIONS,
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
    });
    if (filters.sort.field === 'size') {
      const dir = filters.sort.direction;
      return [...result].sort((a, b) => {
        const sizeA = (a as InstalledTaggedItem).installedSizeBytes ?? 0;
        const sizeB = (b as InstalledTaggedItem).installedSizeBytes ?? 0;
        return dir === 'asc' ? sizeA - sizeB : sizeB - sizeA;
      });
    }
    return result;
  }, [items, filters, mapDownloadTotals, modDownloadTotals]);

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
  };
}
