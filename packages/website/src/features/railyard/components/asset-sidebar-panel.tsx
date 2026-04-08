'use client';

import type { Dispatch, SetStateAction } from 'react';
import {
  AssetSidebarPanel as SharedAssetSidebarPanel,
  type AssetSidebarPanelProps as SharedAssetSidebarPanelProps,
  SIDEBAR_CONTENT_OFFSET,
} from '@sbm/shared/railyard-ui/shared/asset-sidebar-panel';
import type { SharedFilterState } from '@sbm/shared/railyard-core/filter-state';

import type {
  SearchFilterState,
  SearchFilterUpdater,
} from '../../../hooks/use-filtered-items';

export { SIDEBAR_CONTENT_OFFSET };

export type AssetSidebarPanelProps = Omit<
  SharedAssetSidebarPanelProps,
  'filters' | 'onFiltersChange'
> & {
  filters: SearchFilterState;
  onFiltersChange: (updater: SearchFilterUpdater) => void;
};

export function AssetSidebarPanel({
  filters,
  onFiltersChange,
  ...props
}: AssetSidebarPanelProps) {
  const handleChange: Dispatch<SetStateAction<SharedFilterState>> = (
    updater,
  ) => {
    onFiltersChange(updater as unknown as SearchFilterUpdater);
  };

  return (
    <SharedAssetSidebarPanel
      {...props}
      filters={filters}
      onFiltersChange={handleChange}
    />
  );
}
