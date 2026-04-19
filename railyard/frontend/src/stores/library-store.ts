import {
  type AssetQueryFilterStoreState,
  createDefaultSourceFilters,
  type SourceAssetQueryFilterState,
  type SourceQualityMapFilters,
} from '@subway-builder-modded/asset-listings-state';
import {
  ASSET_TYPES,
  DEFAULT_SORT_STATE,
  type SortState as InstalledSortState,
} from '@subway-builder-modded/config';
import {
  cloneFilterState,
  createFilterByAssetType,
  type FilterByAssetType,
  switchFilter,
  syncFilter,
} from '@subway-builder-modded/stores-core';
import { create } from 'zustand';

type LibraryFilters = Omit<SourceAssetQueryFilterState, 'sort'> & {
  sort: InstalledSortState;
};

type LibraryFilterByAssetType = FilterByAssetType<
  'mod' | 'map',
  SourceQualityMapFilters,
  InstalledSortState
>;

const defaultLibraryFilters: LibraryFilters = {
  ...createDefaultSourceFilters(),
  sort: {
    ...DEFAULT_SORT_STATE,
    field: 'name',
    direction: 'asc',
  },
};

interface LibraryState extends AssetQueryFilterStoreState<
  LibraryFilters,
  LibraryFilterByAssetType
> {
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
  selectAll: (ids: string[]) => void;
  removeSelected: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  filters: cloneFilterState(defaultLibraryFilters),
  page: 1,
  scopedByType: createFilterByAssetType(ASSET_TYPES, defaultLibraryFilters, 1),
  selectedIds: new Set<string>(),
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
    set((state) =>
      switchFilter(state.filters, state.page, state.scopedByType, type),
    ),
  setPage: (page) =>
    set((state) => {
      if (state.page === page) return state;
      return {
        page,
        scopedByType: syncFilter(state.scopedByType, state.filters, page),
      };
    }),
  toggleSelected: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedIds: next };
    }),
  selectAll: (ids) => set({ selectedIds: new Set(ids) }),
  removeSelected: (ids) =>
    set((state) => {
      if (ids.length === 0) return state;

      const next = new Set(state.selectedIds);
      for (const id of ids) {
        next.delete(id);
      }

      return { selectedIds: next };
    }),
  clearSelection: () => set({ selectedIds: new Set() }),
  isSelected: (id) => get().selectedIds.has(id),
}));
