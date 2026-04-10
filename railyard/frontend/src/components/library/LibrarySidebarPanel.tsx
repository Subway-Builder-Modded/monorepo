import {
  AssetSidebarPanel,
  type AssetSidebarPanelProps,
} from '@/components/shared/AssetSidebarPanel';

export type LibrarySidebarPanelProps = Omit<
  AssetSidebarPanelProps,
  'ariaLabel'
>;

export function LibrarySidebarPanel(props: LibrarySidebarPanelProps) {
  return <AssetSidebarPanel {...props} ariaLabel="Library filters" />;
}
