import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
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

type RangeBandPoint = Record<string, string | number | [number, number]>;

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

function getNumericValue(point: MultiSeriesPoint, key: string) {
  const value = point[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getBandKey(key: string) {
  return `__band_${key}`;
}

function getAverageValue(data: MultiSeriesPoint[], key: string) {
  if (data.length === 0) return 0;
  return data.reduce((sum, point) => sum + getNumericValue(point, key), 0) / data.length;
}

function buildRangeBandData(data: MultiSeriesPoint[], lines: LineConfig[]): RangeBandPoint[] {
  const stableLineOrder = [...lines].sort(
    (left, right) => getAverageValue(data, left.key) - getAverageValue(data, right.key),
  );

  return data.map((point) => {
    const nextPoint: RangeBandPoint = { ...point };

    stableLineOrder.forEach((line, index) => {
      const upper = getNumericValue(point, line.key);
      const lower = index > 0 ? getNumericValue(point, stableLineOrder[index - 1]!.key) : 0;
      nextPoint[getBandKey(line.key)] = upper >= lower ? [lower, upper] : [upper, upper];
    });

    return nextPoint;
  });
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
  const isMultiSeries = lines.length > 1;
  const gradientStartOpacity = isMultiSeries ? 0.16 : 0.25;
  const gradientEndOpacity = isMultiSeries ? 0.025 : 0.025;
  const chartData = isMultiSeries ? buildRangeBandData(data, lines) : data;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          margin={margin}
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
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
                  <stop offset="5%" stopColor={color} stopOpacity={gradientStartOpacity} />
                  <stop offset="95%" stopColor={color} stopOpacity={gradientEndOpacity} />
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
                payload={(payload as AnalyticsTooltipPayload[])
                  .filter((entry) => !String(entry.dataKey ?? "").startsWith("__band_"))
                  .filter((entry) => !hideZeroTooltipEntries || entry.value !== 0)}
                label={label}
              />
            )}
          />
          {isMultiSeries
            ? lines.map((line, index) => {
                const color = line.color ?? `var(--chart-${index + 1}, var(--accent))`;
                const bandKey = getBandKey(line.key);
                return (
                  <Area
                    key={bandKey}
                    type="monotone"
                    dataKey={bandKey}
                    name={line.name}
                    stroke="none"
                    fill={`url(#analytics-line-gradient-${line.key})`}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={true}
                    animationDuration={700}
                    animationEasing="ease-out"
                    legendType="none"
                    tooltipType="none"
                  />
                );
              })
            : null}
          {lines.map((line, index) => {
            const color = line.color ?? `var(--chart-${index + 1}, var(--accent))`;
            return isMultiSeries ? (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: color }}
                isAnimationActive={true}
                animationDuration={700}
                animationEasing="ease-out"
              />
            ) : (
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
        </ComposedChart>
      </ResponsiveContainer>
      <AnalyticsLineLegend lines={lines} />
    </div>
  );
}
