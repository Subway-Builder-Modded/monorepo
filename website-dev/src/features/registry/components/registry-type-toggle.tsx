import { Map, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";
import type { RegistryTypeConfig } from "@/shared/registry-card/registry-item-types";

type RegistryTypeToggleProps = {
  activeTypeId: string;
  onChange: (typeId: string) => void;
  counts?: Record<string, number>;
  className?: string;
};

export function RegistryTypeToggle({
  activeTypeId,
  onChange,
  counts,
  className,
}: RegistryTypeToggleProps) {
  return (
    <div
      role="group"
      className={cn(
        "isolate flex items-center gap-1 rounded-lg border border-border/50 bg-background p-0.5",
        className,
      )}
    >
      {REGISTRY_TYPES.map((type) => (
        <TypeButton
          key={type.id}
          type={type}
          isActive={activeTypeId === type.id}
          count={counts?.[type.id]}
          onClick={() => onChange(type.id)}
        />
      ))}
    </div>
  );
}

type TypeButtonProps = {
  type: RegistryTypeConfig;
  isActive: boolean;
  count?: number;
  onClick: () => void;
};

function TypeButton({ type, isActive, count, onClick }: TypeButtonProps) {
  const Icon = type.id === "maps" ? Map : Package;
  const isCountLoading = count === undefined;

  const accentStyle = {
    "--type-accent-light": type.accentLight,
    "--type-accent-dark": type.accentDark,
  } as React.CSSProperties;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      onClick={onClick}
      style={accentStyle}
      className={cn(
        "relative flex h-10 min-w-[7.75rem] items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "border-[color-mix(in_srgb,var(--type-accent-light)_35%,var(--border))] bg-[color-mix(in_srgb,var(--type-accent-light)_14%,var(--background))] text-[var(--type-accent-light)] dark:border-[color-mix(in_srgb,var(--type-accent-dark)_35%,var(--border))] dark:bg-[color-mix(in_srgb,var(--type-accent-dark)_16%,var(--background))] dark:text-[var(--type-accent-dark)]"
          : "border-transparent bg-background text-muted-foreground hover:border-[color-mix(in_srgb,var(--type-accent-light)_28%,var(--border))] hover:bg-[color-mix(in_srgb,var(--type-accent-light)_10%,var(--background))] hover:text-[var(--type-accent-light)] dark:hover:border-[color-mix(in_srgb,var(--type-accent-dark)_28%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--type-accent-dark)_12%,var(--background))] dark:hover:text-[var(--type-accent-dark)]",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden={true} />
      {type.pluralLabel}
      {isCountLoading ? (
        <span
          className={cn(
            "h-4 min-w-[2.1rem] animate-pulse rounded-md border border-border/40 bg-background px-1.5 py-0.5",
          )}
          aria-hidden={true}
        />
      ) : (
        <span
          className={cn(
            "min-w-[2.1rem] rounded-md border border-border/40 bg-background px-1.5 py-0.5 text-center text-xs font-medium tabular-nums text-inherit",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
