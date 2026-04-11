import {
  ASSET_TYPES,
  DEFAULT_SORT_STATE,
  type AssetType,
  type PerPage,
} from '@subway-builder-modded/config';
import {
  createFilterByAssetType,
  createRandomSeed,
  type BaseAssetFilterState,
  type BaseAssetQueryFilterState,
  type FilterByAssetType,
} from '@subway-builder-modded/stores-core';

export interface SourceQualityMapFilters {
  locations: string[];
  sourceQuality: string[];
  levelOfDetail: string[];
  specialDemand: string[];
  [key: string]: string[];
}

export interface DataQualityMapFilters {
  locations: string[];
  dataQuality: string[];
  levelOfDetail: string[];
  specialDemand: string[];
  [key: string]: string[];
}

export type SourceAssetQueryFilterState = BaseAssetQueryFilterState<
  AssetType,
  SourceQualityMapFilters
>;

export type DataAssetQueryFilterState = BaseAssetQueryFilterState<
  AssetType,
  DataQualityMapFilters
>;

export type SourceAssetFilterState = BaseAssetFilterState<SourceQualityMapFilters>;
export type DataAssetFilterState = BaseAssetFilterState<DataQualityMapFilters>;

export type SourceFilterByAssetType = FilterByAssetType<
  AssetType,
  SourceQualityMapFilters
>;

export type DataFilterByAssetType = FilterByAssetType<
  AssetType,
  DataQualityMapFilters
>;

export type AssetQueryFilterUpdater<TFilters> =
  | TFilters
  | ((prev: TFilters) => TFilters);

export interface AssetQueryFilterStoreState<TFilters, TScopedByType> {
  filters: TFilters;
  page: number;
  scopedByType: TScopedByType;
  setFilters: (updater: AssetQueryFilterUpdater<TFilters>) => void;
  setType: (type: AssetType) => void;
  setPage: (page: number) => void;
}

export function createDefaultSourceFilters(
  type: AssetType = 'map',
  perPage: PerPage = 12,
): SourceAssetQueryFilterState {
  return {
    query: '',
    type,
    sort: DEFAULT_SORT_STATE,
    randomSeed: createRandomSeed(),
    perPage,
    mod: {
      tags: [],
    },
    map: {
      locations: [],
      sourceQuality: [],
      levelOfDetail: [],
      specialDemand: [],
    },
  };
}

export function createDefaultDataFilters(
  type: AssetType = 'map',
  perPage: PerPage = 12,
): DataAssetQueryFilterState {
  return {
    query: '',
    type,
    sort: DEFAULT_SORT_STATE,
    randomSeed: createRandomSeed(),
    perPage,
    mod: {
      tags: [],
    },
    map: {
      locations: [],
      dataQuality: [],
      levelOfDetail: [],
      specialDemand: [],
    },
  };
}

export function createSourceFilterByAssetType(
  filters: SourceAssetQueryFilterState,
  page: number,
): SourceFilterByAssetType {
  return createFilterByAssetType(ASSET_TYPES, filters, page);
}

export function createDataFilterByAssetType(
  filters: DataAssetQueryFilterState,
  page: number,
): DataFilterByAssetType {
  return createFilterByAssetType(ASSET_TYPES, filters, page);
}