import { cn } from "@/lib/utils";
import type { RegistryViewMode } from "@/features/registry/lib/types";
import { Grip, LayoutGrid, Rows3 } from "lucide-react";

type RegistryViewToggleProps = {
  viewMode: RegistryViewMode;
  onChange: (mode: RegistryViewMode) => void;
  className?: string;
};

const VIEW_OPTIONS: { id: RegistryViewMode; label: string; icon: typeof LayoutGrid }[] = [
  { id: "full", label: "Full", icon: LayoutGrid },
  { id: "compact", label: "Compact", icon: Grip },
  { id: "list", label: "List", icon: Rows3 },
];

export function RegistryViewToggle({ viewMode, onChange, className }: RegistryViewToggleProps) {
  return (
    <div
      role="group"
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
          aria-label={label}
          aria-checked={viewMode === id}
          onClick={() => onChange(id)}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            viewMode === id
              ? "bg-[color-mix(in_srgb,var(--suite-accent-light)_14%,var(--background))] text-[var(--suite-accent-light)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_16%,var(--background))] dark:text-[var(--suite-accent-dark)]"
              : "text-muted-foreground hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,var(--background))] hover:text-[var(--suite-accent-light)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_12%,var(--background))] dark:hover:text-[var(--suite-accent-dark)]",
          )}
        >
          <Icon className="size-4" aria-hidden={true} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
