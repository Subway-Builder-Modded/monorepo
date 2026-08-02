import type { ComponentType, CSSProperties } from "react";

export type AnalyticsToggleOption<T extends string> = {
  id: T;
  label: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  accentLight: string;
  accentDark: string;
};

/**
 * Segmented single-select toggle used by analytics surfaces (history modes,
 * asset-type filters, chart-style switches). Options carry their own accent
 * pair so mixed-accent option sets (e.g. maps blue next to mods red) work.
 */
export function AnalyticsModeToggle<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  minOptionWidth = "7.25rem",
  compact = false,
}: {
  value: T;
  options: AnalyticsToggleOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  minOptionWidth?: string;
  /** Icon-only rendering; option labels become tooltips/aria-labels. */
  compact?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="isolate inline-flex flex-wrap items-center justify-center gap-1 rounded-xl border border-border/50 bg-background/70 p-1 shadow-sm"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={compact ? option.label : undefined}
            title={compact ? option.label : undefined}
            onClick={() => onChange(option.id)}
            style={
              {
                "--type-accent-light": option.accentLight,
                "--type-accent-dark": option.accentDark,
                minWidth: compact ? "2.25rem" : minOptionWidth,
              } as CSSProperties
            }
            className={`group relative flex h-9 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-[background-color,color,border-color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? "border-[color-mix(in_srgb,var(--type-accent-light)_44%,transparent)] bg-[color-mix(in_srgb,var(--type-accent-light)_18%,var(--background))] text-[var(--type-accent-light)] dark:border-[color-mix(in_srgb,var(--type-accent-dark)_44%,transparent)] dark:bg-[color-mix(in_srgb,var(--type-accent-dark)_18%,var(--background))] dark:text-[var(--type-accent-dark)]"
                : "border-[color-mix(in_srgb,var(--type-accent-light)_20%,transparent)] bg-transparent text-[var(--type-accent-light)] hover:border-[color-mix(in_srgb,var(--type-accent-light)_36%,transparent)] hover:bg-[color-mix(in_srgb,var(--type-accent-light)_10%,var(--background))] dark:text-[var(--type-accent-dark)] dark:hover:border-[color-mix(in_srgb,var(--type-accent-dark)_36%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--type-accent-dark)_10%,var(--background))]"
            }`}
          >
            <span className="inline-flex flex-1 items-center justify-center gap-1.5">
              {Icon ? <Icon className="size-4 shrink-0" aria-hidden={true} /> : null}
              {compact ? null : <span>{option.label}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
