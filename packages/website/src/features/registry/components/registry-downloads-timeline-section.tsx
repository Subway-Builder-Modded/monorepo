'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';
import type { RegistryAnalyticsData } from '@/types/registry-analytics';
import {
  MAP_COLOR,
  MOD_COLOR,
  SafeChartContainer,
  SectionHeader,
  formatCount,
  useClientReady,
} from './registry-shared';

function formatDateLabel(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;
  return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}

const FIRST_SNAPSHOT_DATE = '2026-03-11';

export function RegistryDownloadsTimelineSection({
  data,
}: {
  data: RegistryAnalyticsData;
}) {
  const isClientReady = useClientReady();
  const chartRows = data.downloadsByTypeDaily
    .filter((row) => row.date !== FIRST_SNAPSHOT_DATE)
    .map((row) => ({
      ...row,
      label: formatDateLabel(row.date),
    }));

  if (chartRows.length === 0) return null;

  return (
    <section className="mb-12">
      <SectionHeader icon={LineChartIcon} title="Downloads by Asset Type" />
      <div className="rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
        <div className="mb-3 flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: MAP_COLOR }}
            />
            Maps
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: MOD_COLOR }}
            />
            Mods
          </span>
        </div>
        <SafeChartContainer height={320}>
          {isClientReady ? (
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <LineChart
                data={chartRows}
                margin={{ top: 8, right: 14, bottom: 8, left: 0 }}
              >
                <CartesianGrid
                  horizontal
                  vertical={false}
                  stroke="var(--border)"
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  tickMargin={6}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => formatCount(value)}
                  width={38}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const maps = Number(
                      payload.find((entry) => entry.dataKey === 'mapDownloads')
                        ?.value ?? 0,
                    );
                    const mods = Number(
                      payload.find((entry) => entry.dataKey === 'modDownloads')
                        ?.value ?? 0,
                    );
                    return (
                      <div className="rounded-lg bg-overlay/75 p-2.5 text-xs text-overlay-fg ring ring-current/10 backdrop-blur-lg">
                        <div className="font-semibold">{label as string}</div>
                        <div className="mt-1 flex items-center justify-between gap-3">
                          <span style={{ color: MAP_COLOR }}>Maps</span>
                          <span className="font-semibold tabular-nums">
                            {maps.toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-3">
                          <span style={{ color: MOD_COLOR }}>Mods</span>
                          <span className="font-semibold tabular-nums">
                            {mods.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                  wrapperStyle={{ outline: 'none' }}
                />
                <Line
                  type="monotone"
                  dataKey="mapDownloads"
                  stroke={MAP_COLOR}
                  strokeWidth={2.2}
                  dot={false}
                  activeDot={{ r: 3, fill: MAP_COLOR }}
                />
                <Line
                  type="monotone"
                  dataKey="modDownloads"
                  stroke={MOD_COLOR}
                  strokeWidth={2.2}
                  dot={false}
                  activeDot={{ r: 3, fill: MOD_COLOR }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </SafeChartContainer>
      </div>
    </section>
  );
}
