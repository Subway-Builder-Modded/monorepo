import type { SiteSuite, SiteSuiteNavItem } from "@/app/lib/site-navigation";
import { cn } from "@/app/lib/utils";
import { SiteIcon } from "./site-icon";

type SuiteNavCardProps = {
  suite: SiteSuite;
  item: SiteSuiteNavItem;
  active?: boolean;
  compact?: boolean;
};

export function SuiteNavCard({ suite, item, active = false, compact = false }: SuiteNavCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-[hsl(var(--navbar))] p-4 transition-colors duration-300",
        "border-[color:color-mix(in_srgb,var(--suite-accent-light)_45%,var(--border))]",
        "hover:bg-[color:color-mix(in_srgb,var(--suite-accent-light)_88%,white)] hover:text-[var(--suite-text-inverted-light)]",
        "dark:border-[color:color-mix(in_srgb,var(--suite-accent-dark)_45%,var(--border))]",
        "dark:hover:bg-[color:color-mix(in_srgb,var(--suite-accent-dark)_78%,black)] dark:hover:text-[var(--suite-text-inverted-dark)]",
        active &&
          "bg-[color:color-mix(in_srgb,var(--suite-accent-light)_88%,white)] text-[var(--suite-text-inverted-light)] dark:bg-[color:color-mix(in_srgb,var(--suite-accent-dark)_78%,black)] dark:text-[var(--suite-text-inverted-dark)]",
      )}
    >
      <div className="absolute inset-x-0 top-0 signage-line h-px opacity-90" />
      <div
        className={cn(
          "grid items-center gap-3",
          compact ? "grid-cols-[4.8rem_1fr]" : "grid-cols-[6.5rem_1fr]",
        )}
      >
        <div
          className={cn(
            "rounded-2xl border bg-black/85 p-3 text-white transition-colors duration-300",
            "group-hover:bg-white/18 group-hover:text-current",
            "dark:bg-white/15 dark:text-white dark:group-hover:bg-black/35",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={cn("font-black leading-none", compact ? "text-4xl" : "text-5xl")}>
              {suite.lineMarker.line}
            </span>
            <SiteIcon iconKey={suite.iconKey} className="size-5" />
          </div>
          <div className="mt-2 text-xs font-semibold tracking-[0.08em] opacity-85">号线</div>
        </div>

        <div className="min-w-0">
          <div className="text-xl font-bold leading-tight tracking-tight">{item.title}</div>
          <p className="mt-1 text-sm leading-snug opacity-85">{item.description}</p>
          <div className="mt-2 text-xs font-semibold tracking-[0.08em] opacity-75">
            {suite.lineMarker.label}
          </div>
        </div>
      </div>
    </div>
  );
}
