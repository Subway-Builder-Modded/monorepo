import {
  SidebarPanel as SharedSidebarPanel,
  type SidebarPanelProps as SharedSidebarPanelProps,
} from '@subway-builder-modded/asset-listings-ui';

import type { AssetQueryFilters } from '@/stores/asset-query-filter-store';

function getNavbarOffsetPx(): number {
  return (
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--app-navbar-offset',
      ),
    ) - 48 || 72
  );
}

export type SidebarPanelProps = SharedSidebarPanelProps<AssetQueryFilters>;

export function SidebarPanel(props: SidebarPanelProps) {
  return (
    <SharedSidebarPanel
      {...props}
      getNavbarOffsetPx={getNavbarOffsetPx}
      getPositionScrollTarget={() => document.getElementById('root')}
      scrollToTop={() =>
        document.getElementById('root')?.scrollTo({ top: 0, behavior: 'auto' })
      }
      scrollClassName="sidebar-scroll"
    />
  );
}
