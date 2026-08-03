import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BarConfig, ChartMargin, MultiSeriesPoint } from "./chart-types";
import { AnalyticsChartLegend, toggleLegendKey } from "./chart-legend";
import { AnalyticsTooltip, type AnalyticsTooltipPayload } from "./chart-tooltip";
import {
  CHART_AXIS_LINE_COLOR,
  CHART_AXIS_TICK_COLOR,
  CHART_FONT_SIZE,
  CHART_GRID_STROKE,
  DEFAULT_CHART_MARGIN,
  createCategoryTicks,
  createLineChartTicks,
  formatXAxisLabel,
  formatYAxisTick,
} from "./chart-theme";

export type AnalyticsStackedBarChartProps = {
  data: MultiSeriesPoint[];
  bars: BarConfig[];
  xAxisKey: string;
  xAxisTicks?: Array<string | number>;
  height?: number;
  margin?: ChartMargin;
};

function getNumericValue(point: MultiSeriesPoint, key: string) {
  const value = point[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getStackTotals(data: MultiSeriesPoint[], bars: BarConfig[]) {
  return data.map((point) =>
    bars.reduce((total, bar) => total + getNumericValue(point, bar.key), 0),
  );
}

export function AnalyticsStackedBarChart({
  data,
  bars,
  xAxisKey,
  xAxisTicks,
  height = 260,
  margin = DEFAULT_CHART_MARGIN,
}: AnalyticsStackedBarChartProps) {
  const [hiddenKeys, setHiddenKeys] = useState<ReadonlySet<string>>(new Set());
  // Fallback colors come from the bar's ORIGINAL index so they stay stable
  // while series are hidden.
  const resolvedBars = bars.map((bar, index) => ({
    ...bar,
    resolvedColor: bar.color ?? `var(--chart-${index + 1}, var(--accent))`,
  }));
  const visibleBars = resolvedBars.filter((bar) => !hiddenKeys.has(bar.key));
  const stackTotals = getStackTotals(data, visibleBars);
  const { domain: yDomain, ticks: yTicks } = createLineChartTicks(stackTotals, {
    startAtZero: true,
  });
  const xTicks = xAxisTicks ?? createCategoryTicks(data.map((point) => point[xAxisKey]), 8);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={margin}
          barCategoryGap="18%"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_GRID_STROKE}
            strokeOpacity={0.12}
            vertical={false}
          />
          <XAxis
            dataKey={xAxisKey}
            ticks={xTicks}
            interval={0}
            tick={{ fill: CHART_AXIS_TICK_COLOR, fillOpacity: 0.72, fontSize: CHART_FONT_SIZE }}
            tickLine={{ stroke: CHART_AXIS_LINE_COLOR, strokeOpacity: 0.36 }}
            axisLine={{ stroke: CHART_AXIS_LINE_COLOR, strokeOpacity: 0.36 }}
            tickMargin={8}
            minTickGap={0}
            tickFormatter={formatXAxisLabel}
          />
          <YAxis
            tick={{ fill: CHART_AXIS_TICK_COLOR, fillOpacity: 0.72, fontSize: CHART_FONT_SIZE }}
            tickLine={{ stroke: CHART_AXIS_LINE_COLOR, strokeOpacity: 0.36 }}
            axisLine={{ stroke: CHART_AXIS_LINE_COLOR, strokeOpacity: 0.36 }}
            width={44}
            domain={yDomain}
            ticks={yTicks}
            interval={0}
            tickFormatter={formatYAxisTick}
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload, label }) => (
              <AnalyticsTooltip
                active={active}
                payload={payload as AnalyticsTooltipPayload[]}
                label={label}
              />
            )}
            cursor={{ fill: "currentColor", fillOpacity: 0.1 }}
          />
          {visibleBars.map((bar, index) => {
            const isLast = index === visibleBars.length - 1;
            return (
              <Bar
                key={bar.key}
                dataKey={bar.key}
                name={bar.name}
                fill={bar.resolvedColor}
                fillOpacity={0.9}
                stackId={bar.stackId ?? "stack"}
                radius={isLast ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                isAnimationActive={true}
                animationDuration={700}
                animationEasing="ease-out"
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
      <AnalyticsChartLegend
        entries={resolvedBars.map((bar) => ({
          key: bar.key,
          name: bar.name,
          color: bar.resolvedColor,
        }))}
        hiddenKeys={hiddenKeys}
        onToggle={(key) =>
          setHiddenKeys((current) => toggleLegendKey(current, key, resolvedBars.length))
        }
      />
    </div>
  );
}
