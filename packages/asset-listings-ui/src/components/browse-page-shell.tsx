import { cn } from '@subway-builder-modded/shared-ui';
import type { CSSProperties, ReactNode } from 'react';

import { AssetSidebarPanel, type AssetSidebarPanelProps } from './asset-sidebar-panel';

export interface BrowsePageShellProps<
  TFilters = unknown,
  TType extends string = 'map' | 'mod',
> {
  sidebar: Pick<
    AssetSidebarPanelProps<TFilters, TType>,
    | 'open'
    | 'onToggle'
    | 'ariaLabel'
    | 'filters'
    | 'currentType'
    | 'onTypeChange'
    | 'typeButtons'
    | 'renderPanel'
  > & {
    content: ReactNode;
  };
  content: {
    className?: string;
    style?: CSSProperties;
    header: ReactNode;
    error?: ReactNode;
    search: ReactNode;
    controlsLeft: ReactNode;
    controlsRight: ReactNode;
    body: ReactNode;
  };
}

export function BrowsePageShell<
  TFilters = unknown,
  TType extends string = 'map' | 'mod',
>({ sidebar, content }: BrowsePageShellProps<TFilters, TType>) {
  return (
    <div className="relative isolate">
      <AssetSidebarPanel
        open={sidebar.open}
        onToggle={sidebar.onToggle}
        ariaLabel={sidebar.ariaLabel}
        filters={sidebar.filters}
        currentType={sidebar.currentType}
        onTypeChange={sidebar.onTypeChange}
        typeButtons={sidebar.typeButtons}
        renderPanel={sidebar.renderPanel}
      >
        {sidebar.content}
      </AssetSidebarPanel>

      <div
        className={cn('relative z-10 space-y-5', content.className)}
        style={content.style}
      >
        {content.header}
        {content.error}
        {content.search}

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            {content.controlsLeft}
            {content.controlsRight}
          </div>
          {content.body}
        </div>
      </div>
    </div>
  );
}
