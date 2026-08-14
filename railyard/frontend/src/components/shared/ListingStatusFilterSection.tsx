import {
  FILTER_COUNT_BADGE_CLASS,
  FILTER_SECTION_TITLE_CLASS,
} from '@subway-builder-modded/asset-listings-ui';
import { cn } from '@subway-builder-modded/shared-ui';
import type { LucideIcon } from 'lucide-react';
import { Archive, CircleCheck, HardDrive, Trash2 } from 'lucide-react';

import type { ListingStatusFilter } from '@/stores/status-filter-slice';

interface ListingStatusOption {
  key: ListingStatusFilter;
  label: string;
  Icon: LucideIcon;
  iconColor: string;
  activeText: string;
  activeBg: string;
  activePill: string;
  hoverBg: string;
  hoverText: string;
}

// Not red — retirement is an author decision, not a defect: Deprecated wears
// slate blue (reversible), Deleted a darker charcoal (permanent), and Local
// keeps the amber it has always used for unmanaged installs.
const LISTING_STATUS_OPTIONS: Record<ListingStatusFilter, ListingStatusOption> =
  {
    active: {
      key: 'active',
      label: 'Active',
      Icon: CircleCheck,
      iconColor: 'text-[var(--action-success)]',
      activeText: 'text-[var(--action-success)]',
      activeBg:
        'bg-[color-mix(in_oklab,var(--action-success)_12%,transparent)]',
      activePill: 'bg-[var(--action-success)]',
      hoverBg:
        'group-hover:bg-[color-mix(in_oklab,var(--action-success)_10%,transparent)]',
      hoverText: 'group-hover:text-[var(--action-success)]',
    },
    deprecated: {
      key: 'deprecated',
      label: 'Deprecated',
      Icon: Archive,
      iconColor: 'text-slate-500 dark:text-slate-400',
      activeText: 'text-slate-600 dark:text-slate-300',
      activeBg: 'bg-slate-400/15',
      activePill: 'bg-slate-500',
      hoverBg: 'group-hover:bg-slate-400/15',
      hoverText: 'group-hover:text-slate-600 dark:group-hover:text-slate-300',
    },
    deleted: {
      key: 'deleted',
      label: 'Deleted',
      Icon: Trash2,
      iconColor: 'text-zinc-800 dark:text-zinc-200',
      activeText: 'text-zinc-900 dark:text-zinc-100',
      activeBg: 'bg-zinc-700/25 dark:bg-zinc-300/15',
      activePill: 'bg-zinc-800 dark:bg-zinc-200',
      hoverBg: 'group-hover:bg-zinc-700/25 dark:group-hover:bg-zinc-300/15',
      hoverText: 'group-hover:text-zinc-900 dark:group-hover:text-zinc-100',
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
  };

/** The classes worth offering: those with members. */
export function visibleListingStatusOptions(
  options: readonly ListingStatusFilter[],
  counts: Record<ListingStatusFilter, number>,
): ListingStatusFilter[] {
  // Selection state deliberately does not keep a chip on screen: an empty
  // class never constrains a union filter. The narrowing filters (asset
  // status, tags) do the opposite, since a selected zero-count option there
  // forces an empty result the user would otherwise be unable to undo.
  return options.filter((key) => (counts[key] ?? 0) > 0);
}

/** Whether deselecting this class would empty the selection. */
export function isListingStatusLocked(
  key: ListingStatusFilter,
  visible: readonly ListingStatusFilter[],
  selected: readonly ListingStatusFilter[],
): boolean {
  // Hidden classes are excluded from the tally — they contribute nothing to
  // the union, so a selection of only-hidden classes is effectively empty.
  const effective = visible.filter((option) => selected.includes(option));
  return effective.length === 1 && effective[0] === key;
}

export interface ListingStatusFilterSectionProps {
  activeStatuses: readonly ListingStatusFilter[];
  counts: Record<ListingStatusFilter, number>;
  onToggle: (status: ListingStatusFilter) => void;
  /** Which classes this surface has: Browse omits local, Library omits
   * deleted (deleted assets are purged and never installed). */
  options: readonly ListingStatusFilter[];
}

/** Status: composable union over a listing's registry-side lifecycle. */
export function ListingStatusFilterSection({
  activeStatuses,
  counts,
  onToggle,
  options,
}: ListingStatusFilterSectionProps) {
  const visibleKeys = visibleListingStatusOptions(options, counts);
  // Below two classes there is no choice to make; matches the sidebar's
  // minimumVisibleOptions convention.
  if (visibleKeys.length < 2) return null;
  const visibleOptions = visibleKeys.map((key) => LISTING_STATUS_OPTIONS[key]);

  return (
    <div>
      <p className={cn(FILTER_SECTION_TITLE_CLASS, 'mb-1 px-1 py-1.5')}>
        Status
      </p>
      <nav className="space-y-0.5" aria-label="Status filter">
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
            const active = activeStatuses.includes(key);
            const count = counts[key] ?? 0;
            // Surface the never-empty rule as a disabled control rather than
            // a silently ignored click.
            const locked =
              active && isListingStatusLocked(key, visibleKeys, activeStatuses);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onToggle(key)}
                aria-pressed={active}
                disabled={locked}
                className="group relative w-full text-left disabled:cursor-default"
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
  );
}
