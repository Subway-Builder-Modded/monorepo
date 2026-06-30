import { type AssetQueryFilterStoreState } from '@subway-builder-modded/asset-listings-state';
import type { AssetType } from '@subway-builder-modded/config';
import {
  type BaseAssetFilterFields,
  type FilterByAssetType,
  switchFilter,
  syncFilter,
} from '@subway-builder-modded/stores-core';

import type { StatusFilter } from '@/stores/status-filter-slice';

// The query-filter slice models the shared sidebar: Browse and Library apply the
// same query/sort/type filtering, only against different datasets (remote vs.
// installed). Both stores compose this slice and supply their own initial filter
// shape; the action bodies (setFilters/setType/setPage) are identical.

// The narrowed set signature only needs the keys this slice writes. statusFilters
// is included because switching dataset type clears the active status filters.
type QueryFilterWritable<TFilter, TScoped> = {
  filters: TFilter;
  page: number;
  scopedByType: TScoped;
  statusFilters: StatusFilter[];
};

type QueryFilterSet<TFilter, TScoped> = (
  partial:
    | Partial<QueryFilterWritable<TFilter, TScoped>>
    | ((
        state: QueryFilterWritable<TFilter, TScoped>,
      ) => Partial<QueryFilterWritable<TFilter, TScoped>>),
) => void;

export function createQueryFilterSlice<
  TMapFilters extends Record<string, string[]>,
  TSortState extends object,
  TFilter extends BaseAssetFilterFields<TMapFilters, TSortState> & {
    type: AssetType;
  },
>(
  set: QueryFilterSet<
    TFilter,
    FilterByAssetType<AssetType, TMapFilters, TSortState>
  >,
  initial: {
    filters: TFilter;
    scopedByType: FilterByAssetType<AssetType, TMapFilters, TSortState>;
  },
): AssetQueryFilterStoreState<
  TFilter,
  FilterByAssetType<AssetType, TMapFilters, TSortState>
> {
  return {
    filters: initial.filters,
    page: 1,
    scopedByType: initial.scopedByType,
    setFilters: (updater) =>
      set((state) => {
        const nextFilters =
          typeof updater === 'function' ? updater(state.filters) : updater;
        return {
          filters: nextFilters,
          scopedByType: syncFilter(state.scopedByType, nextFilters, state.page),
        };
      }),
    setType: (type) =>
      set((state) => ({
        ...switchFilter(state.filters, state.page, state.scopedByType, type),
        statusFilters: [],
      })),
    setPage: (page) =>
      set((state) => {
        if (state.page === page) return state;
        return {
          page,
          scopedByType: syncFilter(state.scopedByType, state.filters, page),
        };
      }),
  };
}
