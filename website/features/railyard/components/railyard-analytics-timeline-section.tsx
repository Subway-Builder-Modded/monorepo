'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';
import { usePersistedState } from '@/lib/use-persisted-state';
import type { RailyardAnalyticsData } from '@/types/railyard-analytics';
import {
  compareSemver,
  formatCompactNumber,
  RAILYARD_ACCENT_COLOR,
  RailyardTimelinePeriodToggle,
  RailyardSectionHeader,
  SafeChartContainer,
  useClientReady,
} from './railyard-analytics-shared';

type TimelinePeriod = 'all' | '1' | '3' | '7' | '14';

function periodLabel(period: TimelinePeriod): string {
  if (period === '1') return 'Last 24 Hours';
  if (period === '3') return 'Last 3 Days';
  if (period === '7') return 'Last Week';
  if (period === '14') return 'Last 2 Weeks';
  return 'All Time';
}

function trimEdgeZeros<T extends { downloads: number }>(rows: T[]): T[] {
  if (rows.length === 0) return [];

  let start = 0;
  let end = rows.length - 1;

  while (start <= end && rows[start]?.downloads === 0) start += 1;
  while (end >= start && rows[end]?.downloads === 0) end -= 1;

  if (start > end) return [];
  return rows.slice(start, end + 1);
}

function isSubDaily(period: TimelinePeriod): boolean {
  return period === '1' || period === '3';
}

function formatTimeLabel(timestamp: string, period: TimelinePeriod): string {
  if (isSubDaily(period)) {
    const dt = new Date(timestamp);
    if (Number.isNaN(dt.getTime())) return timestamp;
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    const hour = String(dt.getHours()).padStart(2, '0');
    const minute = String(dt.getMinutes()).padStart(2, '0');
    if (period === '1') return `${hour}:${minute}`;
    return `${month}/${day} ${hour}:${minute}`;
  }

  return timestamp.slice(5).replace('-', '/');
}

function formatLongDate(timestamp: string): string {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return timestamp;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function filterDailyRange(
  rows: Array<{ date: string; downloads: number }>,
  period: TimelinePeriod,
): Array<{ date: string; downloads: number }> {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  if (period === 'all') return trimEdgeZeros(sorted);
  const days = Number.parseInt(period, 10);
  return trimEdgeZeros(sorted.slice(-days));
}

function filterHourlyRange(
  rows: Array<{ timestamp: string; downloads: number }>,
  period: TimelinePeriod,
): Array<{ timestamp: string; downloads: number }> {
  const sorted = [...rows].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );
  if (sorted.length === 0) return [];
  if (period === 'all') return trimEdgeZeros(sorted);

  const hours = period === '1' ? 24 : 72;
  const end = new Date(sorted[sorted.length - 1]?.timestamp ?? '');
  if (Number.isNaN(end.getTime())) return trimEdgeZeros(sorted.slice(-hours));

  const startMs = end.getTime() - (hours - 1) * 60 * 60 * 1000;
  const filtered = sorted.filter((row) => {
    const current = new Date(row.timestamp);
    if (Number.isNaN(current.getTime())) return false;
    return current.getTime() >= startMs;
  });

  return trimEdgeZeros(filtered);
}

export function RailyardAnalyticsTimelineSection({
  data,
}: {
  data: RailyardAnalyticsData;
}) {
  const isClientReady = useClientReady();
  const [period, setPeriod] = usePersistedState<TimelinePeriod>(
    'railyard.analytics.timeline.period',
    'all',
  );

  const totalRows = useMemo(() => {
    if (isSubDaily(period)) {
      return filterHourlyRange(data.hourlyTotals, period).map((row) => ({
        timestamp: row.timestamp,
        downloads: row.downloads,
      }));
    }

    return filterDailyRange(data.dailyTotals, period).map((row) => ({
      timestamp: row.date,
      downloads: row.downloads,
    }));
  }, [data.dailyTotals, data.hourlyTotals, period]);

  const chartRows = useMemo(
    () =>
      totalRows
        .filter((row) => row.timestamp.slice(5, 10) !== '03-30')
        .map((row) => ({
          ...row,
          label: formatTimeLabel(row.timestamp, period),
        })),
    [period, totalRows],
  );

  const timelineStats = useMemo(() => {
    const totalDownloads = totalRows.reduce(
      (sum, row) => sum + row.downloads,
      0,
    );

    const windowStart = totalRows[0]?.timestamp;
    const windowEnd = totalRows[totalRows.length - 1]?.timestamp;

    const selectedVersionRows = data.versionDaily
      .map((row) => ({
        version: row.version,
        downloads: row.daily
          .filter((dailyRow) => {
            if (!windowStart || !windowEnd) return false;
            return (
              dailyRow.date >= windowStart.slice(0, 10) &&
              dailyRow.date <= windowEnd.slice(0, 10)
            );
          })
          .reduce((sum, dailyRow) => sum + dailyRow.downloads, 0),
      }))
      .filter((row) => row.downloads > 0);

    const topVersion = [...selectedVersionRows].sort((a, b) => {
      if (b.downloads !== a.downloads) return b.downloads - a.downloads;
      return compareSemver(b.version, a.version);
    })[0];

    return {
      totalDownloads,
      topVersion,
    };
  }, [data.versionDaily, totalRows]);

  return (
    <section className="mb-12">
      <RailyardSectionHeader icon={LineChartIcon} title="Downloads Over Time" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <RailyardTimelinePeriodToggle value={period} onChange={setPeriod} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 ring-1 ring-foreground/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Downloads
          </p>
          <p className="mt-1 text-2xl font-black text-foreground">
            {Math.round(timelineStats.totalDownloads).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">{periodLabel(period)}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 ring-1 ring-foreground/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Top Version
          </p>
          <p className="mt-1 text-2xl font-black text-foreground">
            {timelineStats.topVersion
              ? `v${timelineStats.topVersion.version}`
              : 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground">
            {timelineStats.topVersion
              ? `${timelineStats.topVersion.downloads.toLocaleString()} downloads`
              : 'No downloads in selected period'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 ring-1 ring-foreground/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Most Popular OS
          </p>
          <p className="mt-1 text-2xl font-black text-foreground">
            {data.summary.topOs || 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.summary.topOsDownloads.toLocaleString()} downloads
          </p>
        </div>
      </div>

      <div className="mb-10 rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Downloads ({periodLabel(period)})
        </p>

        <SafeChartContainer height={320}>
          {isClientReady ? (
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <AreaChart
                data={chartRows}
                margin={{ top: 8, right: 14, bottom: 8, left: 0 }}
              >
                <defs>
                  <linearGradient
                    id="railyard-timeline-gradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={RAILYARD_ACCENT_COLOR}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor={RAILYARD_ACCENT_COLOR}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
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
                  interval={
                    chartRows.length > (isSubDaily(period) ? 12 : 14)
                      ? 'preserveStartEnd'
                      : 0
                  }
                  tickMargin={6}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => formatCompactNumber(value)}
                  width={40}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const value = Number(payload[0]?.value ?? 0);
                    const row = payload[0]?.payload as
                      | { timestamp?: string }
                      | undefined;

                    return (
                      <div className="rounded-lg bg-overlay/95 p-2.5 text-xs text-overlay-fg ring ring-current/20 backdrop-blur-lg">
                        <div className="font-semibold">{label as string}</div>
                        <div className="mt-1 flex items-center justify-between gap-3">
                          <span>Downloads</span>
                          <span className="font-semibold tabular-nums">
                            {value.toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-muted-fg">
                          {formatLongDate(row?.timestamp ?? '')}
                        </div>
                      </div>
                    );
                  }}
                  wrapperStyle={{ outline: 'none' }}
                />
                <Area
                  type="monotone"
                  dataKey="downloads"
                  stroke={RAILYARD_ACCENT_COLOR}
                  strokeWidth={2.5}
                  fill="url(#railyard-timeline-gradient)"
                  dot={false}
                  activeDot={{ r: 3, fill: RAILYARD_ACCENT_COLOR }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : null}
        </SafeChartContainer>
      </div>
    </section>
  );
}
