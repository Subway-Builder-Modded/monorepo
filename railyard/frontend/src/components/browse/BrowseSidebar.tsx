import {
  AssetSidebarPanel,
  type AssetSidebarPanelProps,
} from '@/components/shared/AssetSidebarPanel';

export type BrowseSidebarProps = Omit<AssetSidebarPanelProps, 'ariaLabel'>;

export function BrowseSidebar(props: BrowseSidebarProps) {
  return <AssetSidebarPanel {...props} ariaLabel="Browse filters" />;
}
