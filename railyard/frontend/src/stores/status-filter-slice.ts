export type StatusFilter = 'compatible' | 'local' | 'incompatible' | 'test';

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
