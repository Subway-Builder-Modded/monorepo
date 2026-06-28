import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { CHART_FONT_SIZE } from './chart-theme';

export type PieSlice = {
  key: string;
  name: string;
  value: number;
  color?: string;
};

export type AnalyticsPieChartProps = {
  data: PieSlice[];
  height?: number;
  innerRadius?: number | string;
  outerRadius?: number | string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatPercent(value: number) {
  return `${value.toLocaleString('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: value > 0 && value < 1 ? 1 : 0,
  })}%`;
}

function AnalyticsPieLegend({ data }: { data: PieSlice[] }) {
  return (
    <ul
      style={{
        alignItems: 'center',
        color: 'hsl(var(--foreground))',
        columnGap: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        fontSize: CHART_FONT_SIZE,
        justifyContent: 'center',
        listStyle: 'none',
        margin: '0.5rem 0 0',
        padding: 0,
        rowGap: '0.5rem',
      }}
    >
      {data.map((slice, index) => {
        const color = slice.color ?? `var(--chart-${index + 1}, var(--accent))`;
        return (
          <li
            key={slice.key}
            style={{
              alignItems: 'center',
              display: 'inline-flex',
              gap: '0.45rem',
              lineHeight: 1,
            }}
          >
            <span
              style={{
                backgroundColor: color,
                borderRadius: '9999px',
                display: 'block',
                flexShrink: 0,
                height: '0.5rem',
                transform: 'translateY(-0.03rem)',
                width: '0.5rem',
              }}
              aria-hidden={true}
            />
            <span style={{ color, fontWeight: 700 }}>{slice.name}</span>
            <span style={{ fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, monospace)' }}>
              {formatNumber(slice.value)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function AnalyticsPieTooltip({
  active,
  slice,
  total,
}: {
  active?: boolean;
  slice?: PieSlice;
  total: number;
}) {
  if (!active || !slice) return null;

  const color = slice.color ?? 'var(--accent)';
  const share = total > 0 ? (slice.value / total) * 100 : 0;

  return (
    <div className="rounded-lg border border-border/60 bg-popover px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold" style={{ color }}>
        {slice.name}
      </p>
      <p className="text-foreground">
        <span className="font-semibold">{formatNumber(slice.value)}</span>
        <span aria-hidden={true}> • </span>
        <span className="font-semibold">{formatPercent(share)}</span>
      </p>
    </div>
  );
}

function getPieLabelPosition(props: PieLabelRenderProps) {
  const cx = Number(props.cx ?? 0);
  const cy = Number(props.cy ?? 0);
  const midAngle = Number(props.midAngle ?? 0);
  const innerRadius = Number(props.innerRadius ?? 0);
  const outerRadius = Number(props.outerRadius ?? 0);
  const radius = innerRadius + (outerRadius - innerRadius) * 0.58;
  const radians = (-midAngle * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function renderPieLabel(props: PieLabelRenderProps) {
  const value = Number(props.value ?? 0);
  const percent = Number(props.percent ?? 0);
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(percent) || percent < 0.04) {
    return null;
  }

  const position = getPieLabelPosition(props);

  return (
    <text
      className="fill-white stroke-foreground dark:fill-foreground dark:stroke-background"
      x={position.x}
      y={position.y}
      fontSize={CHART_FONT_SIZE}
      fontWeight={800}
      paintOrder="stroke"
      strokeOpacity={0.38}
      strokeWidth={2.75}
      textAnchor="middle"
      dominantBaseline="central"
    >
      {formatPercent(percent * 100)}
    </text>
  );
}

export function AnalyticsPieChart({
  data,
  height = 240,
  innerRadius = 0,
  outerRadius = '82%',
}: AnalyticsPieChartProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            label={renderPieLabel}
            labelLine={false}
            isAnimationActive={true}
            animationDuration={700}
            animationEasing="ease-out"
          >
            {data.map((slice, index) => {
              const color = slice.color ?? `var(--chart-${index + 1}, var(--accent))`;
              return <Cell key={slice.key} fill={color} stroke="hsl(var(--background))" />;
            })}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              const slice = payload?.[0]?.payload as PieSlice | undefined;
              return (
                <AnalyticsPieTooltip
                  active={active}
                  slice={slice}
                  total={total}
                />
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <AnalyticsPieLegend data={data} />
    </div>
  );
}
