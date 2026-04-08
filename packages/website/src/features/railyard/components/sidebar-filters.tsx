'use client';

import {
  BadgeCheck,
  Check,
  GraduationCap,
  Layers3,
  MapPin,
  Package,
  Tag,
  X,
} from 'lucide-react';
import type { ComponentType, Dispatch, SetStateAction } from 'react';

import { Separator } from '@/components/ui/separator';
import type { SearchFilterState } from '@/hooks/use-filtered-items';
import type { AssetType } from '@/lib/railyard/asset-types';
import { filterVisibleListingValues } from '@/lib/railyard/listing-counts';
import {
  DATA_QUALITY_VALUES,
  LEVEL_OF_DETAIL_VALUES,
  LOCATION_TAGS,
  formatDataQuality,
} from '@/lib/railyard/map-filter-values';
import { SEARCH_FILTER_EMPTY_LABELS } from '@/lib/railyard/search';
import { cn } from '@/lib/utils';

const FILTER_SECTION_TITLE_CLASS =
  'text-xs font-semibold uppercase tracking-widest text-muted-foreground';
const FILTER_COUNT_BADGE_CLASS =
  'inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-border/65 bg-muted/45 px-1.5 text-[0.65rem] font-semibold tabular-nums text-muted-foreground transition-colors';

interface SidebarFiltersProps {
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

const typeOptions = [
  { value: 'map' as const, label: 'Maps', icon: MapPin },
  { value: 'mod' as const, label: 'Mods', icon: Package },
];

export function SidebarFilters({
  filters,
  onFiltersChange,
  onTypeChange,
  availableTags,
  availableSpecialDemand,
  modTagCounts,
  mapLocationCounts,
  mapDataQualityCounts,
  mapLevelOfDetailCounts,
  mapSpecialDemandCounts,
  modCount,
  mapCount,
}: SidebarFiltersProps) {
  const counts: Record<AssetType, number> = { mod: modCount, map: mapCount };

  return (
    <div className="space-y-5">
      <div>
        <p
          className={cn(FILTER_SECTION_TITLE_CLASS, 'mb-1 px-1 py-1.5')}
          aria-hidden
        >
          Type
        </p>
        <nav className="space-y-0.5" aria-label="Content type filter">
          {typeOptions.map(({ value, label, icon: Icon }) => {
            const isCurrent = filters.type === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onTypeChange(value)}
                aria-current={isCurrent ? 'true' : undefined}
                className="group relative w-full text-left"
              >
                <span
                  className={cn(
                    'mr-0.5 flex items-center gap-2 rounded-lg px-2',
                    'py-[clamp(0.38rem,0.8vw,0.52rem)]',
                    'text-[clamp(0.78rem,0.9vw,0.86rem)] font-semibold',
                    'transition-all duration-150',
                    'group-hover:bg-accent/45 group-hover:text-primary',
                    isCurrent
                      ? 'bg-accent/45 text-primary'
                      : 'text-muted-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 transition-colors" />
                  <span className="flex-1">{label}</span>
                  <span
                    className={cn(
                      FILTER_COUNT_BADGE_CLASS,
                      isCurrent
                        ? 'border-primary/35 bg-accent/45 text-primary'
                        : 'group-hover:border-primary/35 group-hover:bg-accent/45 group-hover:text-primary',
                    )}
                  >
                    {counts[value]}
                  </span>
                </span>
                {isCurrent && (
                  <span
                    aria-hidden
                    className="absolute right-0 top-0 h-full w-[5px] rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {filters.type !== 'map' && (
        <>
          <Separator />
          <ChecklistFilterSection
            title="Tag"
            icon={Tag}
            values={availableTags}
            counts={modTagCounts}
            selected={filters.mod.tags}
            onChange={(values) =>
              onFiltersChange((prev) => ({
                ...prev,
                mod: { ...prev.mod, tags: values },
              }))
            }
            emptyLabel={SEARCH_FILTER_EMPTY_LABELS.tags}
          />
        </>
      )}

      {filters.type !== 'mod' && (
        <>
          <Separator />
          <ChecklistFilterSection
            title="Location"
            icon={MapPin}
            values={LOCATION_TAGS}
            counts={mapLocationCounts}
            selected={filters.map.locations}
            onChange={(values) =>
              onFiltersChange((prev) => ({
                ...prev,
                map: { ...prev.map, locations: values },
              }))
            }
          />
          <ChecklistFilterSection
            title="Data Quality"
            icon={BadgeCheck}
            values={DATA_QUALITY_VALUES}
            counts={mapDataQualityCounts}
            formatValue={formatDataQuality}
            selected={filters.map.dataQuality}
            onChange={(values) =>
              onFiltersChange((prev) => ({
                ...prev,
                map: { ...prev.map, dataQuality: values },
              }))
            }
          />
          <ChecklistFilterSection
            title="Level of Detail"
            icon={Layers3}
            values={LEVEL_OF_DETAIL_VALUES}
            counts={mapLevelOfDetailCounts}
            selected={filters.map.levelOfDetail}
            onChange={(values) =>
              onFiltersChange((prev) => ({
                ...prev,
                map: { ...prev.map, levelOfDetail: values },
              }))
            }
          />
          <ChecklistFilterSection
            title="Special Demand"
            icon={GraduationCap}
            values={availableSpecialDemand}
            counts={mapSpecialDemandCounts}
            selected={filters.map.specialDemand}
            onChange={(values) =>
              onFiltersChange((prev) => ({
                ...prev,
                map: { ...prev.map, specialDemand: values },
              }))
            }
            emptyLabel={SEARCH_FILTER_EMPTY_LABELS.specialDemand}
          />
        </>
      )}
    </div>
  );
}

interface FilterSectionProperties {
  title: string;
  values: readonly string[];
  counts: Record<string, number>;
  selected: string[];
  icon: ComponentType<{ className?: string }>;
  onChange: (values: string[]) => void;
  emptyLabel?: string;
  formatValue?: (value: string) => string;
}

function ChecklistFilterSection({
  title,
  icon: Icon,
  values,
  counts,
  selected,
  onChange,
  emptyLabel = SEARCH_FILTER_EMPTY_LABELS.generic,
  formatValue = (value) => value,
}: FilterSectionProperties) {
  const visibleValues = filterVisibleListingValues(values, counts, selected);

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  return (
    <div>
      <p
        className={cn(
          FILTER_SECTION_TITLE_CLASS,
          'mb-1 flex items-center gap-1.5 px-1 py-1.5',
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {title}
      </p>
      {visibleValues.length === 0 ? (
        <p className="px-1 py-1 text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="space-y-1 pt-1">
          {visibleValues.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-2 py-1 text-sm font-normal',
                'transition-colors',
                selected.includes(value)
                  ? 'bg-muted/60 text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    'size-4 shrink-0 rounded-sm border border-input flex items-center justify-center transition-colors',
                    selected.includes(value)
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-background text-transparent',
                  )}
                  aria-hidden="true"
                >
                  <Check className="size-3" />
                </span>
                <span>{formatValue(value)}</span>
              </span>
              <span className={FILTER_COUNT_BADGE_CLASS}>
                {counts[value] ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}
      {selected.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => onChange([])}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border/60 px-2 py-0.5 text-[0.68rem] font-medium leading-none text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <X className="h-2.5 w-2.5 shrink-0" />
            <span>Clear</span>
          </button>
        </div>
      )}
    </div>
  );
}
