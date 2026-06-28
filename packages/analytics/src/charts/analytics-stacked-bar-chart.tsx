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

function AnalyticsStackedBarLegend({ bars }: { bars: BarConfig[] }) {
  if (bars.length <= 1) return null;

  return (
    <ul
      style={{
        alignItems: "center",
        color: "hsl(var(--foreground))",
        columnGap: "0.9rem",
        display: "flex",
        flexWrap: "wrap",
        fontSize: CHART_FONT_SIZE,
        justifyContent: "center",
        listStyle: "none",
        margin: "0.75rem 0 0",
        padding: 0,
        rowGap: "0.5rem",
      }}
    >
      {bars.map((bar, index) => {
        const color = bar.color ?? `var(--chart-${index + 1}, var(--accent))`;
        return (
          <li
            key={bar.key}
            style={{
              alignItems: "center",
              display: "inline-flex",
              gap: "0.4rem",
              lineHeight: 1,
            }}
          >
            <span
              style={{
                backgroundColor: color,
                borderRadius: "9999px",
                display: "block",
                flexShrink: 0,
                height: "0.5rem",
                width: "0.5rem",
              }}
              aria-hidden={true}
            />
            <span>{bar.name}</span>
          </li>
        );
      })}
    </ul>
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
  const stackTotals = getStackTotals(data, bars);
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
          {bars.map((bar, index) => {
            const color = bar.color ?? `var(--chart-${index + 1}, var(--accent))`;
            const isLast = index === bars.length - 1;
            return (
              <Bar
                key={bar.key}
                dataKey={bar.key}
                name={bar.name}
                fill={color}
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
      <AnalyticsStackedBarLegend bars={bars} />
    </div>
  );
}
