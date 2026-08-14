/** Asset status: how a listing stands relative to the user's setup. A
 * listing's own lifecycle (and Local, meaning no listing at all) is a
 * separate dimension — see ListingStatusFilter. */
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

/** Composable listing-status classes: the registry-side lifecycle of a
 * listing, plus Local (an installed item with no listing at all — Library
 * only). Multi-select union with a per-surface default; the selection can
 * never be empty (deselecting the last class is a no-op). Deleted only has
 * members when the Show Deleted Listings setting is enabled, so its chip
 * auto-hides by count. */
export type ListingStatusFilter = 'active' | 'deprecated' | 'deleted' | 'local';

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
      set((state) => {
        if (state.listingStatuses.includes(status)) {
          // Never-empty invariant: deselecting the last class is a no-op.
          if (state.listingStatuses.length === 1) return {};
          return {
            listingStatuses: state.listingStatuses.filter((s) => s !== status),
          };
        }
        return { listingStatuses: [...state.listingStatuses, status] };
      }),
  };
}
