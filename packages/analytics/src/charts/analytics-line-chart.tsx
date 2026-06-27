import {
  Area,
  AreaChart,
  CartesianGrid,
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
  xAxisTicks?: Array<string | number>;
  height?: number;
  margin?: ChartMargin;
  startAtZero?: boolean;
  hideZeroTooltipEntries?: boolean;
};

function AnalyticsLineLegend({ lines }: { lines: LineConfig[] }) {
  if (lines.length <= 1) return null;

  return (
    <ul
      style={{
        alignItems: "center",
        color: "hsl(var(--foreground))",
        columnGap: "0.7rem",
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
      {lines.map((line, index) => {
        const color = line.color ?? `var(--chart-${index + 1}, var(--accent))`;
        return (
          <li
            key={line.key}
            style={{
              alignItems: "center",
              display: "inline-flex",
              gap: "0.35rem",
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
            <span>{line.name}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function AnalyticsLineChart({
  data,
  lines,
  xAxisKey,
  xAxisTicks,
  height = 240,
  margin = DEFAULT_CHART_MARGIN,
  startAtZero = false,
  hideZeroTooltipEntries = false,
}: AnalyticsLineChartProps) {
  const yValues = lines.flatMap((line) =>
    data
      .map((point) => point[line.key])
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value)),
  );
  const { domain: yDomain, ticks: yTicks } = createLineChartTicks(yValues, { startAtZero });
  const xTicks = xAxisTicks ?? createCategoryTicks(data.map((point) => point[xAxisKey]), 8);

  return (
    <div className="w-full">
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
                payload={(payload as AnalyticsTooltipPayload[]).filter(
                  (entry) => !hideZeroTooltipEntries || entry.value !== 0,
                )}
                label={label}
              />
            )}
          />
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
      <AnalyticsLineLegend lines={lines} />
    </div>
  );
}
