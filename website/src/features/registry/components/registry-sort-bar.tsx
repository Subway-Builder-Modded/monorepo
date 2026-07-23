import { cn } from "@/lib/utils";
import { REGISTRY_SORT_OPTIONS, isSortSupportedForType } from "@/features/registry/lib/types";
import type { RegistrySortId } from "@/features/registry/lib/types";
import {
  ArrowDown10,
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUp10,
  BadgeCheck,
  Clock,
  ArrowDownToLine,
  Type,
  User,
  Users,
  Building2,
  CalendarDays,
  Shuffle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RegistryToolbarDropdown } from "./registry-toolbar-dropdown";

const SORT_ICONS: Record<RegistrySortId, LucideIcon> = {
  lastUpdated: Clock,
  firstReleased: CalendarDays,
  downloads: ArrowDownToLine,
  name: Type,
  author: User,
  population: Users,
  dataQuality: BadgeCheck,
  cityCode: Building2,
  random: Shuffle,
};

const NUMERIC_SORT_IDS = new Set<RegistrySortId>([
  "lastUpdated",
  "firstReleased",
  "downloads",
  "population",
  "dataQuality",
]);

type RegistrySortBarProps = {
  activeTypeId: string;
  sortId: RegistrySortId;
  sortDir: "asc" | "desc";
  onSortChange: (sortId: RegistrySortId) => void;
  onDirToggle: () => void;
  onRandomReshuffle: () => void;
  excludedSortIds?: RegistrySortId[];
  className?: string;
};

export function RegistrySortBar({
  activeTypeId,
  sortId,
  sortDir,
  onSortChange,
  onDirToggle,
  onRandomReshuffle,
  excludedSortIds = [],
  className,
}: RegistrySortBarProps) {
  const isRandom = sortId === "random";
  const isNumericSort = NUMERIC_SORT_IDS.has(sortId);
  const activeOption = REGISTRY_SORT_OPTIONS.find((s) => s.id === sortId);
  const ActiveIcon = SORT_ICONS[sortId];
  const supportedOptions = REGISTRY_SORT_OPTIONS.filter((opt) =>
    isSortSupportedForType(opt, activeTypeId),
  ).filter((opt) => !excludedSortIds.includes(opt.id));

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <RegistryToolbarDropdown
        value={sortId}
        onValueChange={(v) => onSortChange(v as RegistrySortId)}
        options={supportedOptions.map((opt) => ({
          id: opt.id,
          label: opt.label,
          icon: SORT_ICONS[opt.id],
        }))}
        triggerClassName="min-w-[8.5rem] sm:min-w-[10rem]"
        triggerContent={
          <>
            <ActiveIcon className="size-4 shrink-0" aria-hidden={true} />
            <span>{activeOption?.label ?? "Sort"}</span>
          </>
        }
      />

      {/* Direction toggle — only shown when sort supports direction */}
      {!isRandom && activeOption?.supportsDirection ? (
        <button
          type="button"
          onClick={onDirToggle}
          className="inline-flex h-9 items-center rounded-lg border border-border/30 bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-[color-mix(in_srgb,var(--suite-accent-light)_30%,var(--border))] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_8%,var(--background))] hover:text-[var(--suite-accent-light)] dark:hover:border-[color-mix(in_srgb,var(--suite-accent-dark)_30%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_8%,var(--background))] dark:hover:text-[var(--suite-accent-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isNumericSort ? (
            sortDir === "asc" ? (
              <ArrowUp10 className="size-4" aria-hidden={true} />
            ) : (
              <ArrowDown10 className="size-4" aria-hidden={true} />
            )
          ) : sortDir === "asc" ? (
            <ArrowUpAZ className="size-4" aria-hidden={true} />
          ) : (
            <ArrowDownAZ className="size-4" aria-hidden={true} />
          )}
        </button>
      ) : null}

      {/* Reshuffle — only shown for random sort */}
      {isRandom ? (
        <button
          type="button"
          onClick={onRandomReshuffle}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/30 bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-[color-mix(in_srgb,var(--suite-accent-light)_30%,var(--border))] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_8%,var(--background))] hover:text-[var(--suite-accent-light)] dark:hover:border-[color-mix(in_srgb,var(--suite-accent-dark)_30%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_8%,var(--background))] dark:hover:text-[var(--suite-accent-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Reshuffle
        </button>
      ) : null}
    </div>
  );
}
