import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
  CHART_LEGEND_TEXT_COLOR,
  DEFAULT_CHART_MARGIN,
  formatXAxisLabel,
  formatYAxisTick,
} from "./chart-theme";

export type AnalyticsBarChartProps = {
  data: MultiSeriesPoint[];
  bars: BarConfig[];
  xAxisKey: string;
  height?: number;
  stacked?: boolean;
  margin?: ChartMargin;
};

export function AnalyticsBarChart({
  data,
  bars,
  xAxisKey,
  height = 240,
  stacked = false,
  margin = DEFAULT_CHART_MARGIN,
}: AnalyticsBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={margin}
        barCategoryGap="30%"
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
          tick={{ fill: CHART_AXIS_TICK_COLOR, fillOpacity: 0.72, fontSize: CHART_FONT_SIZE }}
          tickLine={{ stroke: CHART_AXIS_LINE_COLOR, strokeOpacity: 0.36 }}
          axisLine={{ stroke: CHART_AXIS_LINE_COLOR, strokeOpacity: 0.36 }}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={formatXAxisLabel}
        />
        <YAxis
          tick={{ fill: CHART_AXIS_TICK_COLOR, fillOpacity: 0.72, fontSize: CHART_FONT_SIZE }}
          tickLine={{ stroke: CHART_AXIS_LINE_COLOR, strokeOpacity: 0.36 }}
          axisLine={{ stroke: CHART_AXIS_LINE_COLOR, strokeOpacity: 0.36 }}
          width={44}
          domain={[0, "auto"]}
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
          cursor={{ fill: "currentColor", fillOpacity: 0.14 }}
        />
        {bars.length > 1 && (
          <Legend
            wrapperStyle={{ fontSize: CHART_FONT_SIZE, paddingTop: 8, color: CHART_LEGEND_TEXT_COLOR }}
            iconType="circle"
            iconSize={8}
          />
        )}
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
              stackId={stacked ? (bar.stackId ?? "stack") : undefined}
              radius={
                stacked
                  ? isLast
                    ? [3, 3, 0, 0]
                    : [0, 0, 0, 0]
                  : [3, 3, 0, 0]
              }
              isAnimationActive={true}
              animationDuration={700}
              animationEasing="ease-out"
            />
          );
        })}
      </BarChart>
    </ResponsiveContainer>
  );
}
