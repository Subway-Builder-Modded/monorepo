import {
  filterAndSortTaggedItems,
  type SourceAssetQueryFilterState,
} from '@subway-builder-modded/asset-listings-state';
import type { PerPage } from '@subway-builder-modded/config';
import { useMemo } from 'react';

import { usePaginationSync } from '@/hooks/use-pagination-sync';
import { FUSE_SEARCH_OPTIONS } from '@/lib/search';
import {
  buildTaggedItems,
  compareItems,
  type TaggedItem,
} from '@/lib/tagged-items';
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
  mod: {
    tags: string[];
  };
  map: BrowseFilterState['map'];
}

export function buildSearchText(item: TaggedItem): string {
  const base = item.item;
  const values: string[] = [base.name ?? '', base.author.author_alias];

  if (item.type === 'map') {
    const map = base as types.MapManifest;
    values.push(map.city_code ?? '', map.country ?? '');
  }

  return values.filter(Boolean).join(' ');
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

  const filtered = useMemo(
    () =>
      filterAndSortTaggedItems({
        items: allItems,
        filters,
        modDownloadTotals,
        mapDownloadTotals,
        compareItems,
        fuseOptions: FUSE_SEARCH_OPTIONS,
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
    [allItems, filters, mapDownloadTotals, modDownloadTotals],
  );

  const totalResults = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / filters.perPage));

  const items = useMemo(() => {
    const start = (page - 1) * filters.perPage;
    return filtered.slice(start, start + filters.perPage);
  }, [filtered, page, filters.perPage]);

  return {
    items,
    page,
    totalPages,
    totalResults,
    filters,
    setFilters,
    setType,
    setPage,
  };
}

export type { BrowseFilterState } from '@/stores/browse-store';
