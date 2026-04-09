import {
  BadgeCheck,
  ChevronDown,
  GraduationCap,
  Layers3,
  MapPin,
  Package,
  Tag,
  X,
} from 'lucide-react';
import {
  type ComponentType,
  type Dispatch,
  type SetStateAction,
  useState,
} from 'react';

import type { AssetType } from '@sbm/core/railyard/core/asset-types';
import type { SharedFilterState } from '@sbm/core/railyard/core/filter-state';
import { filterVisibleListingValues } from '@sbm/core/railyard/core/listing-counts';
import {
  formatSourceQuality,
  LEVEL_OF_DETAIL_VALUES,
  LOCATION_TAGS,
  SOURCE_QUALITY_VALUES,
} from '@sbm/core/railyard/core/map-filter-values';
import { SEARCH_FILTER_EMPTY_LABELS } from '@sbm/core/railyard/core/search';
import { cx } from './cx';

export const FILTER_SECTION_TITLE_CLASS =
  'text-xs font-semibold uppercase tracking-widest text-muted-foreground';
export const FILTER_COUNT_BADGE_CLASS =
  'inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-border/65 bg-muted/45 px-1.5 text-[0.65rem] font-semibold tabular-nums text-muted-foreground transition-colors';

export interface SidebarFiltersProps {
  filters: SharedFilterState;
  onFiltersChange: Dispatch<SetStateAction<SharedFilterState>>;
  onTypeChange: (type: AssetType) => void;
  availableTags: string[];
  availableSpecialDemand: string[];
  modTagCounts: Record<string, number>;
  mapLocationCounts: Record<string, number>;
  mapSourceQualityCounts: Record<string, number>;
  mapLevelOfDetailCounts: Record<string, number>;
  mapSpecialDemandCounts: Record<string, number>;
  modCount: number;
  mapCount: number;
}

const typeOptions = [
  { value: 'map' as const, label: 'Maps', icon: MapPin },
  { value: 'mod' as const, label: 'Mods', icon: Package },
];

function Separator() {
  return (
    <div
      role="separator"
      className="my-4 h-px w-full shrink-0 bg-border"
    />
  );
}

function CheckboxIndicator({ checked }: { checked: boolean }) {
  return (
    <span
      className={cx(
        'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors',
        checked
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input bg-background',
      )}
      aria-hidden="true"
    >
      {checked && (
        <svg
          viewBox="0 0 12 12"
          className="h-2.5 w-2.5 stroke-current"
          fill="none"
          strokeWidth={2}
        >
          <polyline points="2,6 5,9 10,3" />
        </svg>
      )}
    </span>
  );
}

interface CollapsibleFilterHeaderProps {
  title: string;
  icon: ComponentType<{ className?: string }>;
  open: boolean;
  onToggle: () => void;
}

function CollapsibleFilterHeader({
  title,
  icon: Icon,
  open,
  onToggle,
}: CollapsibleFilterHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group mb-1 flex w-full items-center gap-1.5 rounded-md px-1 py-1.5 transition-colors hover:bg-accent/45"
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      <span
        className={cx(
          FILTER_SECTION_TITLE_CLASS,
          'flex-1 text-left transition-colors group-hover:text-primary',
        )}
      >
        {title}
      </span>
      <ChevronDown
        className={cx(
          'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-all duration-200 group-hover:text-primary',
          !open && '-rotate-90',
        )}
      />
    </button>
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
  const [open, setOpen] = useState(true);
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
      <CollapsibleFilterHeader
        title={title}
        icon={Icon}
        open={open}
        onToggle={() => setOpen((prev) => !prev)}
      />
      <div
        className={cx(
          'grid transition-all duration-200 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {visibleValues.length === 0 ? (
            <p className="px-1 py-1 text-xs text-muted-foreground">
              {emptyLabel}
            </p>
          ) : (
            <div className="space-y-1 pt-1">
              {visibleValues.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggle(value)}
                  className={cx(
                    'flex w-full items-center justify-between rounded-md px-2 py-1 text-sm font-normal',
                    'transition-colors',
                    selected.includes(value)
                      ? 'bg-muted/60 text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <CheckboxIndicator checked={selected.includes(value)} />
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
      </div>
    </div>
  );
}

export function SidebarFilters({
  filters,
  onFiltersChange,
  onTypeChange,
  availableTags,
  availableSpecialDemand,
  modTagCounts,
  mapLocationCounts,
  mapSourceQualityCounts,
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
          className={cx(FILTER_SECTION_TITLE_CLASS, 'mb-1 px-1 py-1.5')}
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
                  className={cx(
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
                    className={cx(
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
            title="Source Quality"
            icon={BadgeCheck}
            values={SOURCE_QUALITY_VALUES}
            counts={mapSourceQualityCounts}
            formatValue={formatSourceQuality}
            selected={filters.map.sourceQuality}
            onChange={(values) =>
              onFiltersChange((prev) => ({
                ...prev,
                map: { ...prev.map, sourceQuality: values },
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

