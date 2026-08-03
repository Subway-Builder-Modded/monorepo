import { cn } from "@/lib/utils";

type RegistryTypeCountBadgeProps = {
  count: number;
  isActive: boolean;
  className?: string;
};

export function RegistryTypeCountBadge({
  count,
  isActive,
  className,
}: RegistryTypeCountBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-md border px-1.5 py-0.5 text-xs font-medium tabular-nums text-inherit transition-colors",
        isActive
          ? "border-[color-mix(in_srgb,var(--ui-accent-light)_45%,var(--border))] bg-[color-mix(in_srgb,var(--ui-accent-light)_18%,var(--background))] text-[var(--ui-accent-light)] dark:border-[color-mix(in_srgb,var(--ui-accent-dark)_45%,var(--border))] dark:bg-[color-mix(in_srgb,var(--ui-accent-dark)_18%,var(--background))] dark:text-[var(--ui-accent-dark)]"
          : "border-[color-mix(in_srgb,var(--ui-accent-light)_34%,var(--border))] group-hover:border-[color-mix(in_srgb,var(--ui-accent-light)_44%,var(--border))] group-hover:bg-[color-mix(in_srgb,var(--ui-accent-light)_14%,var(--background))] group-hover:text-[var(--ui-accent-light)] dark:border-[color-mix(in_srgb,var(--ui-accent-dark)_34%,var(--border))] dark:group-hover:border-[color-mix(in_srgb,var(--ui-accent-dark)_44%,var(--border))] dark:group-hover:bg-[color-mix(in_srgb,var(--ui-accent-dark)_14%,var(--background))] dark:group-hover:text-[var(--ui-accent-dark)]",
        className,
      )}
    >
      {count}
    </span>
  );
}
