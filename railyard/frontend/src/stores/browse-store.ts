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
} from '@subway-builder-modded/stores-core';
import { create } from 'zustand';

import { createQueryFilterSlice } from '@/stores/query-filter-slice';
import {
  createStatusFilterSlice,
  type StatusFilterSlice,
} from '@/stores/status-filter-slice';

export { createRandomSeed };

export type BrowseFilterState = SourceAssetQueryFilterState;
export type BrowseFilterUpdater = AssetQueryFilterUpdater<BrowseFilterState>;
export type BrowseFilterStoreState = AssetQueryFilterStoreState<
  BrowseFilterState,
  SourceFilterByAssetType
>;

const defaultSearchFilters = createDefaultSourceFilters();

interface BrowseViewModeStoreState extends StatusFilterSlice {
  viewMode: SearchViewMode;
  viewModeInitialized: boolean;
  setViewMode: (viewMode: SearchViewMode) => void;
  initializeViewMode: (viewMode: SearchViewMode) => void;
}

export const useBrowseStore = create<
  BrowseFilterStoreState & BrowseViewModeStoreState
>((set, get) => ({
  ...createQueryFilterSlice(set, {
    filters: cloneFilterState(defaultSearchFilters),
    scopedByType: createSourceFilterByAssetType(defaultSearchFilters, 1),
  }),
  viewMode: 'full',
  viewModeInitialized: false,
  ...createStatusFilterSlice(set),
  setViewMode: (viewMode) => set({ viewMode, viewModeInitialized: true }),
  initializeViewMode: (viewMode) => {
    if (get().viewModeInitialized) return;
    set({ viewMode, viewModeInitialized: true });
  },
}));
