import {
  AssetSidebarPanel,
  type AssetSidebarPanelProps,
  SIDEBAR_CONTENT_OFFSET,
} from '@sbm/core/railyard/components/shared/AssetSidebarPanel';

export { SIDEBAR_CONTENT_OFFSET };

export type BrowseSidebarProps = Omit<AssetSidebarPanelProps, 'ariaLabel'>;

export function BrowseSidebar(props: BrowseSidebarProps) {
  return <AssetSidebarPanel {...props} ariaLabel="Browse filters" />;
}
