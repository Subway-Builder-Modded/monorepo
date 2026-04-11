import type { PerPage, SortState } from '@subway-builder-modded/config';

export interface BaseAssetFilterFields<
  TMapFilters extends Record<string, string[]>,
  TSortState extends object = SortState,
> {
  sort: TSortState;
  randomSeed: number;
  mod: {
    tags: string[];
  };
  map: TMapFilters;
}

export interface BaseAssetQueryFilterState<
  TAssetType extends string,
  TMapFilters extends Record<string, string[]>,
  TSortState extends object = SortState,
> extends BaseAssetFilterFields<TMapFilters, TSortState> {
  query: string;
  type: TAssetType;
  perPage: PerPage;
}

export interface BaseAssetFilterState<
  TMapFilters extends Record<string, string[]>,
  TSortState extends object = SortState,
> extends BaseAssetFilterFields<TMapFilters, TSortState> {
  page: number;
}

export type FilterByAssetType<
  TAssetType extends string,
  TMapFilters extends Record<string, string[]>,
  TSortState extends object = SortState,
> = Record<TAssetType, BaseAssetFilterState<TMapFilters, TSortState>>;

export function createRandomSeed(): number {
  return Math.floor(Math.random() * 2_147_483_647);
}

function cloneMapFilters<TMapFilters extends Record<string, string[]>>(
  mapFilters: TMapFilters,
): TMapFilters {
  return Object.fromEntries(
    Object.entries(mapFilters).map(([key, values]) => [key, [...values]]),
  ) as TMapFilters;
}

function cloneFilterFields<
  TMapFilters extends Record<string, string[]>,
  TSortState extends object,
>(
  fields: BaseAssetFilterFields<TMapFilters, TSortState>,
): BaseAssetFilterFields<TMapFilters, TSortState> {
  return {
    sort: { ...fields.sort },
    randomSeed: fields.randomSeed,
    mod: {
      tags: [...fields.mod.tags],
    },
    map: cloneMapFilters(fields.map),
  };
}

export function cloneFilterState<
  TAssetType extends string,
  TMapFilters extends Record<string, string[]>,
  TSortState extends object,
  TState extends BaseAssetQueryFilterState<
    TAssetType,
    TMapFilters,
    TSortState
  >,
>(state: TState): TState {
  return {
    ...state,
    ...cloneFilterFields(state),
  };
}

export function toAssetFilterState<
  TMapFilters extends Record<string, string[]>,
  TSortState extends object,
>(
  fields: BaseAssetFilterFields<TMapFilters, TSortState>,
  page: number,
): BaseAssetFilterState<TMapFilters, TSortState> {
  return {
    ...cloneFilterFields(fields),
    page,
  };
}

export function createFilterByAssetType<
  TAssetType extends string,
  TMapFilters extends Record<string, string[]>,
  TSortState extends object,
>(
  assetTypes: readonly TAssetType[],
  fields: BaseAssetFilterFields<TMapFilters, TSortState>,
  page: number,
): FilterByAssetType<TAssetType, TMapFilters, TSortState> {
  return Object.fromEntries(
    assetTypes.map((assetType) => [assetType, toAssetFilterState(fields, page)]),
  ) as FilterByAssetType<TAssetType, TMapFilters, TSortState>;
}

export function syncFilter<
  TAssetType extends string,
  TMapFilters extends Record<string, string[]>,
  TSortState extends object,
  TFilter extends BaseAssetFilterFields<TMapFilters, TSortState> & {
    type: TAssetType;
  },
>(
  scopedByType: FilterByAssetType<TAssetType, TMapFilters, TSortState>,
  filters: TFilter,
  page: number,
): FilterByAssetType<TAssetType, TMapFilters, TSortState> {
  return {
    ...scopedByType,
    [filters.type]: toAssetFilterState(filters, page),
  };
}

export function applyFilter<
  TAssetType extends string,
  TMapFilters extends Record<string, string[]>,
  TSortState extends object,
  TFilter extends BaseAssetFilterFields<TMapFilters, TSortState> & {
    type: TAssetType;
  },
>(
  filters: TFilter,
  nextType: TAssetType,
  scopedState: BaseAssetFilterState<TMapFilters, TSortState>,
): TFilter {
  return {
    ...filters,
    ...cloneFilterFields(scopedState),
    type: nextType,
  };
}

export function switchFilter<
  TAssetType extends string,
  TMapFilters extends Record<string, string[]>,
  TSortState extends object,
  TFilter extends BaseAssetFilterFields<TMapFilters, TSortState> & {
    type: TAssetType;
  },
>(
  filters: TFilter,
  page: number,
  scopedByType: FilterByAssetType<TAssetType, TMapFilters, TSortState>,
  nextType: TAssetType,
): {
  filters: TFilter;
  page: number;
  scopedByType: FilterByAssetType<TAssetType, TMapFilters, TSortState>;
} {
  const nextScopedByType = syncFilter(scopedByType, filters, page);
  const targetState = nextScopedByType[nextType];

  return {
    filters: applyFilter(filters, nextType, targetState),
    page: targetState.page,
    scopedByType: nextScopedByType,
  };
}