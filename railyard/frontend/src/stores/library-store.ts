import {
  type AssetQueryFilterStoreState,
  createDefaultSourceFilters,
  type SourceAssetQueryFilterState,
  type DataQualityMapFilters,
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
} from '@subway-builder-modded/stores-core';
import { create } from 'zustand';

import { createQueryFilterSlice } from '@/stores/query-filter-slice';
import {
  createStatusFilterSlice,
  type StatusFilterSlice,
} from '@/stores/status-filter-slice';

export type { StatusFilter } from '@/stores/status-filter-slice';

type LibraryFilters = Omit<SourceAssetQueryFilterState, 'sort'> & {
  sort: InstalledSortState;
};

type LibraryFilterByAssetType = FilterByAssetType<
  'mod' | 'map',
  DataQualityMapFilters,
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

interface LibraryState
  extends
    AssetQueryFilterStoreState<LibraryFilters, LibraryFilterByAssetType>,
    StatusFilterSlice {
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
  selectAll: (ids: string[]) => void;
  removeSelected: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  ...createQueryFilterSlice(set, {
    filters: cloneFilterState(defaultLibraryFilters),
    scopedByType: createFilterByAssetType(
      ASSET_TYPES,
      defaultLibraryFilters,
      1,
    ),
  }),
  selectedIds: new Set<string>(),
  ...createStatusFilterSlice(set),
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
