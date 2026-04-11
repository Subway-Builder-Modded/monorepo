import type { AssetQueryFilterUpdater } from '@subway-builder-modded/asset-listings-state';
import type { AssetType, PerPage } from '@subway-builder-modded/config';
import { useEffect, useRef } from 'react';

interface BasePaginationFilterState {
  perPage: PerPage;
  type: AssetType;
}

interface UsePaginationSyncParams<TFilters extends BasePaginationFilterState> {
  defaultPerPage: PerPage;
  filters: TFilters;
  setFilters: (updater: AssetQueryFilterUpdater<TFilters>) => void;
  setPage: (page: number) => void;
}

export function usePaginationSync<TFilters extends BasePaginationFilterState>({
  defaultPerPage,
  filters,
  setFilters,
  setPage,
}: UsePaginationSyncParams<TFilters>): void {
  useEffect(() => {
    setFilters((prev) =>
      prev.perPage === defaultPerPage
        ? prev
        : { ...prev, perPage: defaultPerPage },
    );
  }, [defaultPerPage, setFilters]);

  const didMount = useRef(false);
  const previousTypeRef = useRef(filters.type);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      previousTypeRef.current = filters.type;
      return;
    }
    if (previousTypeRef.current !== filters.type) {
      previousTypeRef.current = filters.type;
      return;
    }
    setPage(1);
  }, [filters, setPage]);
}
