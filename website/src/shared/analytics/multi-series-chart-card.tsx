import { useState, type ComponentType } from "react";
import { ChartColumnBig, ChartLine } from "lucide-react";
import { AnalyticsLineChart, AnalyticsStackedBarChart } from "@subway-builder-modded/analytics";
import {
  AnalyticsModeToggle,
  type AnalyticsToggleOption,
} from "@/shared/analytics/analytics-mode-toggle";
import { ChartCard } from "@/shared/styles/panels";

type ChartStyle = "line" | "bar";

const SUITE_ACCENTS = {
  accentLight: "var(--suite-accent-light)",
  accentDark: "var(--suite-accent-dark)",
} as const;

const CHART_STYLE_OPTIONS: Array<AnalyticsToggleOption<ChartStyle>> = [
  { id: "line", label: "Line chart", icon: ChartLine, ...SUITE_ACCENTS },
  { id: "bar", label: "Stacked bar chart", icon: ChartColumnBig, ...SUITE_ACCENTS },
];

/**
 * The standard multi-series daily chart card with an embedded compact switch
 * for line vs stacked bars. Feed it the same `{key, name, color}` series
 * configs both underlying charts take. Lines answer "who is trending";
 * stacked bars answer "what does each day's total look like, and who
 * contributed".
 */
export function MultiSeriesChartCard({
  title = "Daily Downloads",
  icon = ChartLine,
  chartKey,
  data,
  series,
  xAxisKey = "date",
  xAxisTicks,
  height = 280,
  stackId = "stack",
  hideZeroTooltipEntries = true,
  ariaLabelPrefix = "Chart",
  defaultStyle = "line",
}: {
  title?: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Remount key fragment so animations replay when the underlying cut changes. */
  chartKey: string;
  data: Array<Record<string, string | number>>;
  /**
   * `barOnly` series render in the stacked-bar view but not the line view —
   * an aggregate like "Others" stacks fine as a bar segment but flattens the
   * individual lines when drawn alongside them.
   */
  series: Array<{ key: string; name: string; color?: string; barOnly?: boolean }>;
  xAxisKey?: string;
  xAxisTicks?: Array<string | number>;
  height?: number;
  stackId?: string;
  hideZeroTooltipEntries?: boolean;
  ariaLabelPrefix?: string;
  /** Bars suit count/cadence data (releases per day); lines suit trends. */
  defaultStyle?: ChartStyle;
}) {
  const [chartStyle, setChartStyle] = useState<ChartStyle>(defaultStyle);

  return (
    <ChartCard
      title={title}
      icon={icon}
      actions={
        <AnalyticsModeToggle
          value={chartStyle}
          options={CHART_STYLE_OPTIONS}
          onChange={setChartStyle}
          ariaLabel={`${ariaLabelPrefix} style`}
          compact={true}
        />
      }
    >
      {chartStyle === "line" ? (
        <AnalyticsLineChart
          key={`${chartKey}-line`}
          data={data}
          lines={series.filter((entry) => !entry.barOnly)}
          xAxisKey={xAxisKey}
          xAxisTicks={xAxisTicks}
          height={height}
          startAtZero={true}
          hideZeroTooltipEntries={hideZeroTooltipEntries}
        />
      ) : (
        <AnalyticsStackedBarChart
          key={`${chartKey}-bar`}
          data={data}
          bars={series.map((entry) => ({ ...entry, stackId }))}
          xAxisKey={xAxisKey}
          xAxisTicks={xAxisTicks}
          height={height}
        />
      )}
    </ChartCard>
  );
}
