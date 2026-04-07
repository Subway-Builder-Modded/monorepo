'use client';

import { MapPin, Package } from 'lucide-react';

import { SidebarFilters } from '@/features/railyard/components/sidebar-filters';
import {
  SIDEBAR_CONTENT_OFFSET,
  SidebarPanel,
} from '@/features/railyard/components/sidebar-panel';
import type { SearchFilterState } from '@/hooks/use-filtered-items';
import type { AssetType } from '@/lib/railyard/asset-types';
import { cn } from '@/lib/utils';
import type { Dispatch, SetStateAction } from 'react';

export { SIDEBAR_CONTENT_OFFSET };

export interface AssetSidebarPanelProps {
  open: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  filters: SearchFilterState;
  onFiltersChange: Dispatch<SetStateAction<SearchFilterState>>;
  onTypeChange: (type: AssetType) => void;
  availableTags: string[];
  availableSpecialDemand: string[];
  modTagCounts: Record<string, number>;
  mapLocationCounts: Record<string, number>;
  mapDataQualityCounts: Record<string, number>;
  mapLevelOfDetailCounts: Record<string, number>;
  mapSpecialDemandCounts: Record<string, number>;
  modCount: number;
  mapCount: number;
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
  filters,
  onFiltersChange,
  onTypeChange,
  ...filterProps
}: AssetSidebarPanelProps) {
  const currentType = filters.type;

  const collapsedContent = (
    <>
      {TYPE_BUTTONS.map(({ type, icon: Icon, label }) => {
        const isCurrent = currentType === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onTypeChange(type)}
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
      ariaLabel="Browse filters"
      filters={filters}
      collapsedContent={collapsedContent}
    >
      <SidebarFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        onTypeChange={onTypeChange}
        {...filterProps}
      />
    </SidebarPanel>
  );
}
