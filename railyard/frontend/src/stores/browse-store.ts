import {
  type AssetQueryFilterStoreState,
  type AssetQueryFilterUpdater,
  createDefaultSourceFilters,
  createSourceFilterByAssetType,
  type SourceAssetQueryFilterState,
  type SourceFilterByAssetType,
} from '@subway-builder-modded/asset-listings-state';
import type { SearchViewMode } from '@subway-builder-modded/config';
import {
  cloneFilterState,
  createRandomSeed,
  switchFilter,
  syncFilter,
} from '@subway-builder-modded/stores-core';
import { create } from 'zustand';

export { createRandomSeed };

export type BrowseFilterState = SourceAssetQueryFilterState;
export type BrowseFilterUpdater = AssetQueryFilterUpdater<BrowseFilterState>;
export type BrowseFilterStoreState = AssetQueryFilterStoreState<
  BrowseFilterState,
  SourceFilterByAssetType
>;

const defaultSearchFilters = createDefaultSourceFilters();

interface BrowseViewModeStoreState {
  viewMode: SearchViewMode;
  viewModeInitialized: boolean;
  setViewMode: (viewMode: SearchViewMode) => void;
  initializeViewMode: (viewMode: SearchViewMode) => void;
}

export const useBrowseStore = create<
  BrowseFilterStoreState & BrowseViewModeStoreState
>((set, get) => ({
  filters: cloneFilterState(defaultSearchFilters),
  page: 1,
  scopedByType: createSourceFilterByAssetType(defaultSearchFilters, 1),
  viewMode: 'full',
  viewModeInitialized: false,
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
  setViewMode: (viewMode) => set({ viewMode, viewModeInitialized: true }),
  initializeViewMode: (viewMode) => {
    if (get().viewModeInitialized) return;
    set({ viewMode, viewModeInitialized: true });
  },
}));
