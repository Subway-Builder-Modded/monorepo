import {
  type ListingStatus,
  toggleListingStatus,
} from '@subway-builder-modded/asset-listings-state';

/** Compatibility: how a listing stands relative to the user's setup. Its
 * own lifecycle is a separate dimension — see ListingStatusFilter. */
export type StatusFilter = 'compatible' | 'incompatible' | 'test';

export const STATUS_FILTER_VALUES: readonly StatusFilter[] = [
  'compatible',
  'incompatible',
  'test',
];

export interface StatusFilterSlice {
  statusFilters: StatusFilter[];
  toggleStatusFilter: (filter: StatusFilter) => void;
  clearStatusFilters: () => void;
}

type SetFn = (
  partial:
    | Partial<{ statusFilters: StatusFilter[] }>
    | ((state: {
        statusFilters: StatusFilter[];
      }) => Partial<{ statusFilters: StatusFilter[] }>),
) => void;

export function createStatusFilterSlice(set: SetFn): StatusFilterSlice {
  return {
    statusFilters: [],
    toggleStatusFilter: (filter) =>
      set((state) => ({
        statusFilters: state.statusFilters.includes(filter)
          ? state.statusFilters.filter((f) => f !== filter)
          : [...state.statusFilters, filter],
      })),
    clearStatusFilters: () => set({ statusFilters: [] }),
  };
}

export type ListingStatusFilter = ListingStatus;

export interface ListingStatusSlice {
  listingStatuses: ListingStatusFilter[];
  /** The surface's default selection; dataset switches reset to this. */
  listingStatusDefault: ListingStatusFilter[];
  toggleListingStatus: (status: ListingStatusFilter) => void;
}

export function createListingStatusSlice(
  set: (
    partial:
      | Partial<{ listingStatuses: ListingStatusFilter[] }>
      | ((state: {
          listingStatuses: ListingStatusFilter[];
        }) => Partial<{ listingStatuses: ListingStatusFilter[] }>),
  ) => void,
  defaults: ListingStatusFilter[],
): ListingStatusSlice {
  return {
    listingStatuses: [...defaults],
    listingStatusDefault: defaults,
    toggleListingStatus: (status) =>
      set((state) => ({
        listingStatuses: toggleListingStatus(state.listingStatuses, status),
      })),
  };
}
