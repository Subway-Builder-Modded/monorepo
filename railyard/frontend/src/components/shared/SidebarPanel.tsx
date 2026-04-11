import {
  SidebarPanel as SharedSidebarPanel,
  type SidebarPanelProps as SharedSidebarPanelProps,
} from '@subway-builder-modded/asset-listings-ui';
import type { AssetType } from '@subway-builder-modded/config';

interface RailyardSidebarFilterShape {
  type: AssetType;
  mod: {
    tags: string[];
  };
  map: {
    locations: string[];
    sourceQuality: string[];
    levelOfDetail: string[];
    specialDemand: string[];
  };
}

function getNavbarOffsetPx(): number {
  return (
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--app-navbar-offset',
      ),
    ) - 48 || 72
  );
}

export type SidebarPanelProps<TFilters extends RailyardSidebarFilterShape> =
  SharedSidebarPanelProps<TFilters>;

export function SidebarPanel<TFilters extends RailyardSidebarFilterShape>(
  props: SidebarPanelProps<TFilters>,
) {
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
