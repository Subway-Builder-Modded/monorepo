import { cn } from "@/lib/utils";
import type { RegistryViewMode } from "@/features/registry/lib/types";
import { LayoutGrid, Rows3 } from "lucide-react";

type RegistryViewToggleProps = {
  viewMode: RegistryViewMode;
  onChange: (mode: RegistryViewMode) => void;
  className?: string;
};

const VIEW_OPTIONS: { id: RegistryViewMode; label: string; icon: typeof LayoutGrid }[] = [
  { id: "grid", label: "Grid View", icon: LayoutGrid },
  { id: "list", label: "List View", icon: Rows3 },
];

export function RegistryViewToggle({ viewMode, onChange, className }: RegistryViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className={cn(
        "flex items-center gap-1 rounded-lg border border-border/50 bg-background p-0.5",
        className,
      )}
    >
      {VIEW_OPTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={viewMode === id}
          aria-label={label}
          onClick={() => onChange(id)}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-md text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            viewMode === id
              ? "bg-[color-mix(in_srgb,var(--suite-accent-light)_14%,var(--background))] text-[var(--suite-accent-light)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_16%,var(--background))] dark:text-[var(--suite-accent-dark)]"
              : "text-muted-foreground hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,var(--background))] hover:text-[var(--suite-accent-light)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_12%,var(--background))] dark:hover:text-[var(--suite-accent-dark)]",
          )}
        >
          <Icon className="size-4" aria-hidden={true} />
        </button>
      ))}
    </div>
  );
}
