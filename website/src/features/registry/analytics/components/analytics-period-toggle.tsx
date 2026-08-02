import type { CSSProperties } from "react";
import { Tabs, TabsList, TabsTrigger } from "@subway-builder-modded/shared-ui";
import type { RegistryAnalyticsPeriodId } from "@/features/registry/analytics/lib/load-registry-analytics";

export const REGISTRY_ANALYTICS_PERIOD_OPTIONS: Array<{
  id: RegistryAnalyticsPeriodId;
  label: string;
  days: number | null;
}> = [
  { id: "all-time", label: "All Time", days: null },
  { id: "3d", label: "Last 3 Days", days: 3 },
  { id: "7d", label: "Last 7 Days", days: 7 },
  { id: "14d", label: "Last 14 Days", days: 14 },
  { id: "30d", label: "Last 30 Days", days: 30 },
];

/** The tabs-style period selector shared by registry analytics sections. */
export function RegistryAnalyticsPeriodToggle({
  value,
  onChange,
  className = "grid-cols-2 sm:grid-cols-5",
  style,
}: {
  value: RegistryAnalyticsPeriodId;
  onChange: (period: RegistryAnalyticsPeriodId) => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) => onChange(nextValue as RegistryAnalyticsPeriodId)}
      style={style}
    >
      <TabsList
        className={`grid !h-auto gap-1 rounded-xl border border-border/60 bg-card/70 p-1 ${className}`}
      >
        {REGISTRY_ANALYTICS_PERIOD_OPTIONS.map((period) => (
          <TabsTrigger
            key={period.id}
            value={period.id}
            className="!h-10 min-w-0 justify-center rounded-lg border border-transparent px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-[color-mix(in_srgb,var(--registry-type-accent)_45%,var(--border))] hover:bg-[color-mix(in_srgb,var(--registry-type-accent)_12%,var(--card))] hover:!text-[var(--registry-type-accent)] data-[state=active]:!border-[color-mix(in_srgb,var(--registry-type-accent)_62%,var(--border))] data-[state=active]:!bg-[color-mix(in_srgb,var(--registry-type-accent)_18%,var(--card))] data-[state=active]:!text-[var(--registry-type-accent)]"
          >
            {period.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
