import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LineConfig, ChartMargin, MultiSeriesPoint } from "./chart-types";
import { AnalyticsTooltip, type AnalyticsTooltipPayload } from "./chart-tooltip";
import {
  CHART_AXIS_LINE_COLOR,
  CHART_AXIS_TICK_COLOR,
  CHART_FONT_SIZE,
  CHART_GRID_STROKE,
  CHART_LEGEND_TEXT_COLOR,
  DEFAULT_CHART_MARGIN,
  createCategoryTicks,
  createLineChartTicks,
  formatXAxisLabel,
  formatYAxisTick,
} from "./chart-theme";

export type AnalyticsLineChartProps = {
  data: MultiSeriesPoint[];
  lines: LineConfig[];
  xAxisKey: string;
  height?: number;
  margin?: ChartMargin;
  startAtZero?: boolean;
};

export function AnalyticsLineChart({
  data,
  lines,
  xAxisKey,
  height = 240,
  margin = DEFAULT_CHART_MARGIN,
  startAtZero = false,
}: AnalyticsLineChartProps) {
  const yValues = lines.flatMap((line) =>
    data
      .map((point) => point[line.key])
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value)),
  );
  const { domain: yDomain, ticks: yTicks } = createLineChartTicks(yValues, { startAtZero });
  const xTicks = createCategoryTicks(data.map((point) => point[xAxisKey]), 8);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={margin} style={{ color: "hsl(var(--muted-foreground))" }}>
        <defs>
          {lines.map((line, index) => {
            const color = line.color ?? `var(--chart-${index + 1}, var(--accent))`;
            return (
              <linearGradient
                key={line.key}
                id={`analytics-line-gradient-${line.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.22} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={CHART_GRID_STROKE}
          strokeOpacity={0.12}
          vertical={true}
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
        />
        {lines.length > 1 && (
          <Legend
            wrapperStyle={{ fontSize: CHART_FONT_SIZE, paddingTop: 8, color: CHART_LEGEND_TEXT_COLOR }}
            iconType="circle"
            iconSize={8}
          />
        )}
        {lines.map((line, index) => {
          const color = line.color ?? `var(--chart-${index + 1}, var(--accent))`;
          return (
            <Area
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={color}
              strokeWidth={2}
              fill={`url(#analytics-line-gradient-${line.key})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: color }}
              isAnimationActive={true}
              animationDuration={700}
              animationEasing="ease-out"
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}
