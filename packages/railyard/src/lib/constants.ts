import type { AssetType } from '@sbm/shared/railyard-core/asset-types';
import {
  DEFAULT_SORT_STATE as SHARED_DEFAULT_SORT_STATE,
  getSortOptionsForType as getSharedSortOptionsForType,
  normalizeSortStateForType as normalizeSharedSortStateForType,
  PER_PAGE_OPTIONS,
  type PerPage,
  SORT_OPTIONS as SHARED_SORT_OPTIONS,
  type SortDirection,
  type SortField as SharedSortField,
  SortKey as SharedSortKey,
  type SortOption as SharedSortOption,
  type SortState as SharedSortState,
  sortStateToOptionKey as sharedSortStateToOptionKey,
  TEXT_SORT_FIELDS as SHARED_TEXT_SORT_FIELDS,
} from '@sbm/shared/railyard-core/browse-sort';

export { PER_PAGE_OPTIONS, type PerPage, type SortDirection };

export type SortField = SharedSortField | 'size';
export type SortKey = `${SortField}:${SortDirection}`;

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

export interface SortOption extends Omit<SharedSortOption, 'value' | 'sort'> {
  value: SortKey;
  sort: SortState;
}

export const SORT_OPTIONS = SHARED_SORT_OPTIONS as SortOption[];

export const DEFAULT_SORT_STATE: SortState = SHARED_DEFAULT_SORT_STATE;

export function getSortOptionsForType(type: AssetType): SortOption[] {
  return getSharedSortOptionsForType(type) as SortOption[];
}

export const SortKey = {
  equals(left: SortKey, right: SortKey): boolean {
    return left === right;
  },
  fromState(state: SortState): SortKey {
    return `${state.field}:${state.direction}`;
  },
  toState(value: string): SortState | undefined {
    if (value === 'size:asc') return { field: 'size', direction: 'asc' };
    if (value === 'size:desc') return { field: 'size', direction: 'desc' };
    return SharedSortKey.toState(value) as SortState | undefined;
  },
} as const;

export function sortKeyToState(value: string): SortState {
  return SortKey.toState(value) ?? DEFAULT_SORT_STATE;
}

export function sortStateToOptionKey(
  state: SortState,
  type: AssetType,
): SortKey {
  if (state.field === 'size') {
    return SortKey.fromState(DEFAULT_SORT_STATE);
  }

  const sharedState: SharedSortState = {
    field: state.field,
    direction: state.direction,
  };

  return sharedSortStateToOptionKey(sharedState, type) as SortKey;
}

export function toggleSortField(
  current: SortState,
  field: Exclude<SortField, 'random'>,
): SortState {
  if (current.field === field) {
    return {
      field,
      direction: current.direction === 'asc' ? 'desc' : 'asc',
    };
  }

  return {
    field,
    direction: 'asc',
  };
}

export const TEXT_SORT_FIELDS = SHARED_TEXT_SORT_FIELDS as ReadonlySet<SortField>;

export function normalizeSortStateForType(
  state: SortState,
  type: AssetType,
): SortState {
  if (state.field === 'size') {
    return DEFAULT_SORT_STATE;
  }

  const sharedState: SharedSortState = {
    field: state.field,
    direction: state.direction,
  };

  return normalizeSharedSortStateForType(sharedState, type) as SortState;
}

