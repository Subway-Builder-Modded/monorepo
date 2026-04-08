import type { Dispatch, SetStateAction } from 'react';
import {
  AssetSidebarPanel as SharedAssetSidebarPanel,
  type AssetSidebarPanelProps as SharedAssetSidebarPanelProps,
  SIDEBAR_CONTENT_OFFSET,
} from '@sbm/shared/railyard-ui/shared/asset-sidebar-panel';
import type { SharedFilterState } from '@sbm/shared/railyard-core/filter-state';
import type {
  AssetQueryFilters,
  AssetQueryFilterUpdater,
} from '@railyard-app/stores/asset-query-filter-store';

export { SIDEBAR_CONTENT_OFFSET };

export type AssetSidebarPanelProps = Omit<
  SharedAssetSidebarPanelProps,
  'filters' | 'onFiltersChange'
> & {
  filters: AssetQueryFilters;
  onFiltersChange: (updater: AssetQueryFilterUpdater) => void;
};

export function AssetSidebarPanel({
  filters,
  onFiltersChange,
  ...props
}: AssetSidebarPanelProps) {
  const handleChange: Dispatch<SetStateAction<SharedFilterState>> = (
    updater,
  ) => {
    onFiltersChange(updater as unknown as AssetQueryFilterUpdater);
  };
  return (
    <SharedAssetSidebarPanel
      {...props}
      filters={filters}
      onFiltersChange={handleChange}
    />
  );
}

