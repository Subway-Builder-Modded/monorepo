'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { LayoutGrid } from 'lucide-react';

import {
  MAP_COLOR,
  MOD_COLOR,
  SafeChartContainer,
  SectionHeader,
  useClientReady,
} from '@/features/registry/components/registry-shared';
import type { RegistryAnalyticsData } from '@/types/registry-analytics';

// ---------------------------------------------------------------------------
// Pie label
// ---------------------------------------------------------------------------

const RADIAN = Math.PI / 180;

type PieLabelProps = {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
};

function PieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: PieLabelProps) {
  if (percent < 0.08) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ---------------------------------------------------------------------------
// Reusable mini pie card
// ---------------------------------------------------------------------------

type PieSlice = { name: string; value: number; color: string };

function PieCard({
  label,
  slices,
  unit,
}: {
  label: string;
  slices: PieSlice[];
  unit: string;
}) {
  const isClientReady = useClientReady();

  return (
    <div className="rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <SafeChartContainer height={180}>
        {isClientReady ? (
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <PieChart>
              <Pie
                data={slices}
                cx="50%"
                cy="50%"
                outerRadius={72}
                dataKey="value"
                labelLine={false}
                label={(props) => <PieLabel {...(props as PieLabelProps)} />}
                strokeWidth={2}
                stroke="var(--card)"
              >
                {slices.map((s, i) => (
                  <Cell key={i} fill={s.color} fillOpacity={0.9} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]!;
                  return (
                    <div className="rounded-lg bg-overlay/75 p-2.5 text-xs text-overlay-fg ring ring-current/10 backdrop-blur-lg">
                      <span className="font-semibold">{d.name}</span>
                      <div className="mt-1">
                        {(d.value as number).toLocaleString()} {unit}
                      </div>
                    </div>
                  );
                }}
                wrapperStyle={{ outline: 'none' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : null}
      </SafeChartContainer>
      <div className="mt-3 space-y-1.5">
        {slices.map((s) => (
          <div
            key={s.name}
            className="flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-2">
              <span
                className="inline-block size-2.5 rounded-sm"
                style={{ backgroundColor: s.color, opacity: 0.88 }}
              />
              <span className="text-muted-foreground">{s.name}</span>
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {s.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat mini card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  color,
  compact = false,
  className = '',
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  compact?: boolean;
  className?: string;
}) {
  const baseClass = compact
    ? 'flex h-full min-h-0 flex-col justify-center rounded-xl border border-border bg-card p-4 ring-1 ring-foreground/5'
    : 'rounded-xl border border-border bg-card p-4 ring-1 ring-foreground/5';

  return (
    <div className={`${baseClass} ${className}`.trim()}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={
          compact
            ? 'mt-1.5 text-2xl font-bold tabular-nums'
            : 'mt-1.5 text-2xl font-bold tabular-nums'
        }
        style={{ color }}
      >
        {value}
      </p>
      {sub && (
        <p
          className={
            compact
              ? 'mt-1.5 text-sm text-muted-foreground'
              : 'mt-1 text-xs text-muted-foreground'
          }
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

export function RegistryBreakdownSection({
  data,
}: {
  data: RegistryAnalyticsData;
}) {
  const modDlPct = ((data.modDownloads / data.totalDownloads) * 100).toFixed(0);
  const mapDlPct = ((data.mapDownloads / data.totalDownloads) * 100).toFixed(0);

  const countSlices: PieSlice[] = [
    { name: 'Maps', value: data.mapCount, color: MAP_COLOR },
    { name: 'Mods', value: data.modCount, color: MOD_COLOR },
  ];

  const downloadSlices: PieSlice[] = [
    { name: 'Maps', value: data.mapDownloads, color: MAP_COLOR },
    { name: 'Mods', value: data.modDownloads, color: MOD_COLOR },
  ];

  return (
    <section className="mb-12">
      <SectionHeader icon={LayoutGrid} title="Content Breakdown" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:col-span-9">
          <PieCard
            label="By Listing Count"
            slices={countSlices}
            unit="listings"
          />
          <PieCard
            label="By Downloads"
            slices={downloadSlices}
            unit="downloads"
          />
        </div>
        <div className="grid gap-3 lg:col-span-3 lg:grid-rows-2">
          <StatCard
            label="Map Downloads"
            value={data.mapDownloads.toLocaleString()}
            sub={`${mapDlPct}% of total`}
            color={MAP_COLOR}
            compact
            className="h-full"
          />
          <StatCard
            label="Mod Downloads"
            value={data.modDownloads.toLocaleString()}
            sub={`${modDlPct}% of total`}
            color={MOD_COLOR}
            compact
            className="h-full"
          />
        </div>
      </div>
    </section>
  );
}
