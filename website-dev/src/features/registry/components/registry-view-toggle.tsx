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
        "flex h-9 items-center gap-0.5 rounded-lg border border-border/30 bg-background p-0.5",
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
            "inline-flex h-full items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            viewMode === id
              ? "border border-[color-mix(in_srgb,var(--suite-accent-light)_30%,var(--border))] bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,var(--background))] text-[var(--suite-accent-light)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_30%,var(--border))] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_12%,var(--background))] dark:text-[var(--suite-accent-dark)]"
              : "text-muted-foreground hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_8%,var(--background))] hover:text-[var(--suite-accent-light)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_8%,var(--background))] dark:hover:text-[var(--suite-accent-dark)]",
          )}
        >
          <Icon className="size-3.5" aria-hidden={true} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
