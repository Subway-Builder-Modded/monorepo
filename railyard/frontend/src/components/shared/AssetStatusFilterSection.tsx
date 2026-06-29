import {
  FILTER_COUNT_BADGE_CLASS,
  FILTER_SECTION_TITLE_CLASS,
} from '@subway-builder-modded/asset-listings-ui';
import { cn, Separator } from '@subway-builder-modded/shared-ui';
import {
  CircleAlert,
  FlaskConical,
  HardDrive,
  type LucideIcon,
} from 'lucide-react';

export type AssetStatusFilterKey = 'test' | 'local' | 'incompatible';

interface AssetStatusFilterOption {
  key: AssetStatusFilterKey;
  label: string;
  Icon: LucideIcon;
  iconColor: string;
  activeText: string;
  activeBg: string;
  activePill: string;
  hoverBg: string;
  hoverText: string;
}

const STATUS_OPTIONS: Record<AssetStatusFilterKey, AssetStatusFilterOption> = {
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

export interface AssetStatusFilterSectionProps<
  TStatus extends AssetStatusFilterKey,
> {
  activeFilters: readonly TStatus[];
  counts: Record<TStatus, number>;
  options: readonly TStatus[];
  onToggle: (status: TStatus) => void;
}

export function AssetStatusFilterSection<TStatus extends AssetStatusFilterKey>({
  activeFilters,
  counts,
  options,
  onToggle,
}: AssetStatusFilterSectionProps<TStatus>) {
  const visibleOptions = options
    .map((key) => STATUS_OPTIONS[key])
    .filter(
      ({ key }) =>
        (counts[key as TStatus] ?? 0) > 0 ||
        activeFilters.includes(key as TStatus),
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
              const typedKey = key as TStatus;
              const active = activeFilters.includes(typedKey);
              const count = counts[typedKey] ?? 0;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggle(typedKey)}
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
