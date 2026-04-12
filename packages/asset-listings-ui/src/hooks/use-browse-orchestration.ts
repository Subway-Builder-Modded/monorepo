import type {
  SourceAssetQueryFilterState,
  AssetQueryFilterUpdater,
} from '@subway-builder-modded/asset-listings-state';
import { type AssetType, type PerPage } from '@subway-builder-modded/config';
import type { SortFieldOption } from '../types';

export interface BrowseOrchestrationContext {
  filters: SourceAssetQueryFilterState;
  sortFieldOptions: SortFieldOption[];
  setFilters: (updater: AssetQueryFilterUpdater<SourceAssetQueryFilterState>) => void;
  setType: (type: AssetType) => void;
  setPage: (page: number) => void;
  createRandomSeed?: () => number;
}

export interface BrowsePageCallbacks {
  handleQueryChange: (value: string) => void;
  handleSortChange: (value: SourceAssetQueryFilterState['sort']) => void;
  handlePerPageChange: (value: PerPage) => void;
  handleTypeChange: (type: AssetType) => void;
  handlePageChange: (page: number) => void;
  handleSidebarFiltersChange: (
    updater: (
      prev: Omit<SourceAssetQueryFilterState, 'query' | 'sort' | 'randomSeed' | 'perPage'>,
    ) => Omit<SourceAssetQueryFilterState, 'query' | 'sort' | 'randomSeed' | 'perPage'>,
  ) => void;
}

/**
 * Creates standard browse page callbacks that work with the canonical filter state.
 * Encapsulates the orchestration logic shared between Railyard and website browse pages.
 */
export function createBrowsePageCallbacks(
  ctx: BrowseOrchestrationContext,
): BrowsePageCallbacks {
  const createRandomSeed = ctx.createRandomSeed ?? (() => Math.random());

  return {
    handleQueryChange: (value: string) => {
      ctx.setFilters((prev: SourceAssetQueryFilterState) => ({ ...prev, query: value }));
    },

    handleSortChange: (value: SourceAssetQueryFilterState['sort']) => {
      ctx.setFilters((prev: SourceAssetQueryFilterState) => ({
        ...prev,
        sort: value,
        randomSeed: value.field === 'random' ? createRandomSeed() : prev.randomSeed,
      }));
    },

    handlePerPageChange: (value: PerPage) => {
      ctx.setFilters((prev: SourceAssetQueryFilterState) => ({ ...prev, perPage: value }));
    },

    handleTypeChange: (type: AssetType) => {
      ctx.setType(type);
    },

    handlePageChange: (page: number) => {
      ctx.setPage(page);
    },

    handleSidebarFiltersChange: (updater: (prev: Omit<SourceAssetQueryFilterState, 'query' | 'sort' | 'randomSeed' | 'perPage'>) => Omit<SourceAssetQueryFilterState, 'query' | 'sort' | 'randomSeed' | 'perPage'>) => {
      ctx.setFilters((prev: SourceAssetQueryFilterState) => {
        const next = updater({
          type: prev.type,
          mod: { tags: prev.mod.tags },
          map: {
            locations: prev.map.locations,
            sourceQuality: prev.map.sourceQuality,
            levelOfDetail: prev.map.levelOfDetail,
            specialDemand: prev.map.specialDemand,
          },
        });
        return {
          ...prev,
          type: next.type,
          mod: { ...prev.mod, tags: next.mod.tags },
          map: {
            ...prev.map,
            locations: next.map.locations,
            sourceQuality: next.map.sourceQuality,
            levelOfDetail: next.map.levelOfDetail,
            specialDemand: next.map.specialDemand,
          },
        };
      });
    },
  };
}
