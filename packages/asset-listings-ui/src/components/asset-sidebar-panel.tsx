import { cn } from '@subway-builder-modded/shared-ui';
import { MapPin, Package } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';

import { SidebarPanel } from './sidebar-panel';
import type { GalleryAssetType } from '../types';

export interface AssetSidebarTypeButton<TType extends string> {
  type: TType;
  label: string;
  icon: ComponentType<{ className?: string }>;
  ariaLabel?: string;
}

export interface AssetSidebarPanelRenderProps<TFilters = unknown> {
  open: boolean;
  onToggle: () => void;
  ariaLabel: string;
  filters: TFilters;
  collapsedContent: ReactNode;
  children: ReactNode;
}

export interface AssetSidebarPanelProps<
  TFilters = unknown,
  TType extends string = GalleryAssetType,
> {
  open: boolean;
  onToggle: () => void;
  ariaLabel?: string;
  filters: TFilters;
  currentType: TType;
  onTypeChange: (type: TType) => void;
  children: ReactNode;
  typeButtons?: ReadonlyArray<AssetSidebarTypeButton<TType>>;
  renderPanel?: (props: AssetSidebarPanelRenderProps<TFilters>) => ReactNode;
}

const DEFAULT_TYPE_BUTTONS: ReadonlyArray<AssetSidebarTypeButton<GalleryAssetType>> = [
  { type: 'map', icon: MapPin, label: 'Maps', ariaLabel: 'Show maps' },
  { type: 'mod', icon: Package, label: 'Mods', ariaLabel: 'Show mods' },
];

export function AssetSidebarPanel<
  TFilters = unknown,
  TType extends string = GalleryAssetType,
>({
  open,
  onToggle,
  ariaLabel = 'Browse filters',
  filters,
  currentType,
  onTypeChange,
  children,
  typeButtons,
  renderPanel,
}: AssetSidebarPanelProps<TFilters, TType>) {
  const resolvedTypeButtons =
    typeButtons ??
    (DEFAULT_TYPE_BUTTONS as ReadonlyArray<AssetSidebarTypeButton<TType>>);

  const collapsedContent = (
    <>
      {resolvedTypeButtons.map(({ type, icon: Icon, ariaLabel, label }) => {
        const isCurrent = currentType === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onTypeChange(type)}
            aria-label={ariaLabel ?? `Show ${label.toLowerCase()}`}
            aria-current={isCurrent ? 'true' : undefined}
            className={cn(
              'relative flex h-10 w-full items-center justify-center transition-colors',
              'hover:bg-accent/45 hover:text-primary',
              isCurrent ? 'text-primary' : '',
            )}
          >
            <Icon className="h-4 w-4" />
            {isCurrent && (
              <span
                aria-hidden
                className="absolute right-0 bottom-1 top-1 w-[3px] rounded-full bg-primary"
              />
            )}
          </button>
        );
      })}
    </>
  );

  if (renderPanel) {
    return renderPanel({
      open,
      onToggle,
      ariaLabel,
      filters,
      collapsedContent,
      children,
    });
  }

  return (
    <SidebarPanel
      open={open}
      onToggle={onToggle}
      ariaLabel={ariaLabel}
      filters={filters}
      collapsedContent={collapsedContent}
    >
      {children}
    </SidebarPanel>
  );
}
