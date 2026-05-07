import { Map, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";
import type { RegistryTypeConfig } from "@/shared/registry-card/registry-item-types";
import { RegistryTypeCountBadge } from "./registry-type-count-badge";

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
        "isolate flex items-center gap-1 rounded-xl border border-white/18 bg-white/8 p-1 backdrop-blur-sm dark:border-white/12 dark:bg-white/6",
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
        "group relative flex h-9 min-w-[7.25rem] items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-[background-color,color,border-color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "border border-[color-mix(in_srgb,var(--type-accent-light)_44%,transparent)] bg-[color-mix(in_srgb,var(--type-accent-light)_24%,white)] text-[var(--type-accent-light)] dark:border-[color-mix(in_srgb,var(--type-accent-dark)_44%,transparent)] dark:bg-[color-mix(in_srgb,var(--type-accent-dark)_20%,black)] dark:text-[var(--type-accent-dark)]"
          : "border border-[color-mix(in_srgb,var(--type-accent-light)_28%,transparent)] bg-transparent text-[color-mix(in_srgb,var(--type-accent-light)_72%,white)] hover:border-[color-mix(in_srgb,var(--type-accent-light)_36%,transparent)] hover:bg-[color-mix(in_srgb,var(--type-accent-light)_10%,white)] hover:text-[var(--type-accent-light)] dark:border-[color-mix(in_srgb,var(--type-accent-dark)_28%,transparent)] dark:text-[color-mix(in_srgb,var(--type-accent-dark)_72%,white)] dark:hover:border-[color-mix(in_srgb,var(--type-accent-dark)_36%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--type-accent-dark)_10%,black)] dark:hover:text-[var(--type-accent-dark)]",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden={true} />
      <span className="flex-1 text-center">{type.pluralLabel}</span>
      {isCountLoading ? (
        <span
          className="h-5 min-w-[1.75rem] animate-pulse rounded-md bg-white/15"
          aria-hidden={true}
        />
      ) : (
        <RegistryTypeCountBadge
          count={count}
          isActive={isActive}
          className="min-w-[1.75rem] text-center"
        />
      )}
    </button>
  );
}
