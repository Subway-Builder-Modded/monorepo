'use client';

import { MapPin, Package } from 'lucide-react';

import {
  SidebarFilters,
  type SidebarFiltersProps,
} from '@/features/railyard/components/sidebar-filters';
import { SidebarPanel } from '@/features/railyard/components/sidebar-panel';
import type { AssetType } from '@/lib/railyard/asset-types';
import { cn } from '@subway-builder-modded/shared-ui';

export interface AssetSidebarPanelProps extends SidebarFiltersProps {
  open: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  ariaLabel?: string;
}

const TYPE_BUTTONS: Array<{
  type: AssetType;
  icon: typeof MapPin;
  label: string;
}> = [
  { type: 'map', icon: MapPin, label: 'Show maps' },
  { type: 'mod', icon: Package, label: 'Show mods' },
];

export function AssetSidebarPanel({
  open,
  onToggle,
  mobileOpen,
  onMobileOpenChange,
  ariaLabel = 'Browse filters',
  ...filterProps
}: AssetSidebarPanelProps) {
  const currentType = filterProps.filters.type;

  const collapsedContent = (
    <>
      {TYPE_BUTTONS.map(({ type, icon: Icon, label }) => {
        const isCurrent = currentType === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => filterProps.onTypeChange(type)}
            aria-label={label}
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
                className="absolute right-0 top-1 bottom-1 w-[3px] rounded-full bg-primary"
              />
            )}
          </button>
        );
      })}
    </>
  );

  return (
    <SidebarPanel
      open={open}
      onToggle={onToggle}
      mobileOpen={mobileOpen}
      onMobileOpenChange={onMobileOpenChange}
      ariaLabel={ariaLabel}
      filters={filterProps.filters}
      collapsedContent={collapsedContent}
    >
      <SidebarFilters {...filterProps} />
    </SidebarPanel>
  );
}
