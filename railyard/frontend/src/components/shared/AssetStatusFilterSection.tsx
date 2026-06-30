import {
  FILTER_COUNT_BADGE_CLASS,
  FILTER_SECTION_TITLE_CLASS,
} from '@subway-builder-modded/asset-listings-ui';
import { cn, Separator } from '@subway-builder-modded/shared-ui';
import {
  Check,
  CircleAlert,
  FlaskConical,
  HardDrive,
  type LucideIcon,
} from 'lucide-react';

import type { StatusFilter } from '@/stores/library-store';

interface AssetStatusFilterOption {
  key: StatusFilter;
  label: string;
  Icon: LucideIcon;
  iconColor: string;
  activeText: string;
  activeBg: string;
  activePill: string;
  hoverBg: string;
  hoverText: string;
}

const OPTION_ORDER: StatusFilter[] = [
  'compatible',
  'test',
  'local',
  'incompatible',
];

const STATUS_OPTIONS: Record<StatusFilter, AssetStatusFilterOption> = {
  compatible: {
    key: 'compatible',
    label: 'Compatible',
    Icon: Check,
    iconColor: 'text-[var(--action-success)]',
    activeText: 'text-[var(--action-success)]',
    activeBg: 'bg-[color-mix(in_oklab,var(--action-success)_12%,transparent)]',
    activePill: 'bg-[var(--action-success)]',
    hoverBg:
      'group-hover:bg-[color-mix(in_oklab,var(--action-success)_10%,transparent)]',
    hoverText: 'group-hover:text-[var(--action-success)]',
  },
  test: {
    key: 'test',
    label: 'Test',
    Icon: FlaskConical,
    iconColor: 'text-(--update-primary)',
    activeText: 'text-(--update-primary)',
    activeBg: 'bg-[color-mix(in_srgb,var(--update-primary)_12%,transparent)]',
    activePill: 'bg-[var(--update-primary)]',
    hoverBg:
      'group-hover:bg-[color-mix(in_srgb,var(--update-primary)_10%,transparent)]',
    hoverText: 'group-hover:text-(--update-primary)',
  },
  local: {
    key: 'local',
    label: 'Local',
    Icon: HardDrive,
    iconColor: 'text-amber-500',
    activeText: 'text-amber-600 dark:text-amber-400',
    activeBg: 'bg-amber-500/10',
    activePill: 'bg-amber-500',
    hoverBg: 'group-hover:bg-amber-500/10',
    hoverText: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
  },
  incompatible: {
    key: 'incompatible',
    label: 'Incompatible',
    Icon: CircleAlert,
    iconColor: 'text-red-500',
    activeText: 'text-red-600 dark:text-red-400',
    activeBg: 'bg-red-500/10',
    activePill: 'bg-red-500',
    hoverBg: 'group-hover:bg-red-500/10',
    hoverText: 'group-hover:text-red-600 dark:group-hover:text-red-400',
  },
};

export interface AssetStatusFilterSectionProps {
  activeFilters: readonly StatusFilter[];
  counts: Record<StatusFilter, number>;
  onToggle: (status: StatusFilter) => void;
}

export function AssetStatusFilterSection({
  activeFilters,
  counts,
  onToggle,
}: AssetStatusFilterSectionProps) {
  const visibleOptions = OPTION_ORDER.map((key) => STATUS_OPTIONS[key]).filter(
    ({ key }) => (counts[key] ?? 0) > 0 || activeFilters.includes(key),
  );

  if (visibleOptions.length === 0) return null;

  return (
    <>
      <Separator />
      <div>
        <p className={cn(FILTER_SECTION_TITLE_CLASS, 'mb-1 px-1 py-1.5')}>
          Asset Status
        </p>
        <nav className="space-y-0.5" aria-label="Asset status filter">
          {visibleOptions.map(
            ({
              key,
              label,
              Icon,
              iconColor,
              activeText,
              activeBg,
              activePill,
              hoverBg,
              hoverText,
            }) => {
              const active = activeFilters.includes(key);
              const count = counts[key] ?? 0;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggle(key)}
                  aria-pressed={active}
                  className="group relative w-full text-left"
                >
                  <span
                    className={cn(
                      'mr-0.5 flex items-center gap-2 rounded-lg px-2',
                      'py-[clamp(0.38rem,0.8vw,0.52rem)]',
                      'text-[clamp(0.78rem,0.9vw,0.86rem)] font-semibold',
                      'transition-all duration-150',
                      active
                        ? `${activeBg} ${activeText}`
                        : `text-muted-foreground ${hoverBg} ${hoverText}`,
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 transition-colors',
                        iconColor,
                      )}
                    />
                    <span className="flex-1">{label}</span>
                    {count > 0 && (
                      <span className={FILTER_COUNT_BADGE_CLASS}>{count}</span>
                    )}
                  </span>
                  {active && (
                    <span
                      aria-hidden
                      className={cn(
                        'absolute right-0 top-0 h-full w-1.25 rounded-full',
                        activePill,
                      )}
                    />
                  )}
                </button>
              );
            },
          )}
        </nav>
      </div>
    </>
  );
}
