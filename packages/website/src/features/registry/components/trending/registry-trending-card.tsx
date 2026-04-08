'use client';

import { useId } from 'react';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  REGISTRY_LINK_HOVER_CLS,
  RankBadge,
  SafeChartContainer,
  TypeBadge,
  getListingColor,
  registryLinkStyle,
  trimLeadingZeroDailyData,
  useClientReady,
} from '@/features/registry/components/registry-shared';
import { AuthorName } from '@/components/shared/author-name';
import type {
  EnrichedTrendingRow,
  TrendingModeKey,
} from './registry-trending-types';
import { getModeDays } from './registry-trending-types';

function railyardListingHref(row: EnrichedTrendingRow): string {
  return `/railyard/${row.listing_type === 'map' ? 'maps' : 'mods'}/${row.id}`;
}

function authorAnalyticsHref(row: EnrichedTrendingRow): string {
  return `/registry/authors/${encodeURIComponent(row.author)}`;
}

function listingAnalyticsHref(row: EnrichedTrendingRow): string {
  return `/registry/${row.listing_type === 'map' ? 'maps' : 'mods'}/${row.id}`;
}

const FIRST_SNAPSHOT_DATE = '2026-03-11';

export function RegistryTrendingCard({
  row,
  rank,
  mode,
}: {
  row: EnrichedTrendingRow;
  rank: number;
  mode: TrendingModeKey;
}) {
  const color = getListingColor(row.listing_type);
  const growthRatePct =
    row.baseline_total > 0
      ? ((row.download_change / row.baseline_total) * 100).toFixed(1)
      : null;

  const modeDays = getModeDays(mode);
  const spanDays = modeDays;

  const chartSource = trimLeadingZeroDailyData(row.dailyData).filter(
    (point) => point.date !== FIRST_SNAPSHOT_DATE,
  );
  const windowPointCount = spanDays * 2 + 1;
  const chartData = chartSource.slice(-windowPointCount);
  const splitIndex = Math.max(0, chartData.length - (spanDays + 1));
  const MONTH_ABBR = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const fmtDate = (d: string) => {
    const [, mo, dy] = d.split('-').map(Number);
    return `${MONTH_ABBR[(mo ?? 1) - 1]} ${dy}`;
  };
  const segmentedChartData = chartData.map((point, index) => ({
    ...point,
    label: fmtDate(point.date),
    isCurrent: index >= splitIndex,
  }));

  return (
    <article
      className="min-h-[420px] rounded-2xl border border-border bg-background/70 p-5 ring-1 ring-foreground/5 backdrop-blur-sm"
      style={{ boxShadow: `inset 0 1px 0 ${color}2b` }}
    >
      <div className="grid h-full items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex h-full min-w-0 flex-col">
          <div className="mb-2 flex items-center gap-2">
            <RankBadge rank={rank} />
            <TypeBadge type={row.listing_type} />
          </div>

          <h3 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-[1.7rem]">
            <Link
              href={railyardListingHref(row)}
              className="transition-colors hover:text-foreground/85"
            >
              {row.name}
            </Link>
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            by{' '}
            <AuthorName
              author={row}
              href={authorAnalyticsHref(row)}
              linkClassName={`font-medium ${REGISTRY_LINK_HOVER_CLS}`}
              style={registryLinkStyle(color)}
            />
          </p>

          <div className="mt-4 rounded-xl border border-border bg-card p-4 ring-1 ring-foreground/5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Download History
            </p>
            <TrendingWindowChart
              data={segmentedChartData}
              color={color}
              modeDays={modeDays}
            />
          </div>
        </div>

        <div className="grid h-full grid-rows-[repeat(3,minmax(0,1fr))_auto] gap-3">
          <div className="flex min-h-0 flex-col justify-center rounded-lg border border-border bg-card px-3 py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              New Downloads
            </p>
            <p className="text-xl font-bold tabular-nums" style={{ color }}>
              {row.download_change.toLocaleString()}
            </p>
          </div>
          <div className="flex min-h-0 flex-col justify-center rounded-lg border border-border bg-card px-3 py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Downloads
            </p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {row.totalDownloads.toLocaleString()}
            </p>
          </div>
          <div className="flex min-h-0 flex-col justify-center rounded-lg border border-border bg-card px-3 py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Growth
            </p>
            <p className="text-xl font-bold tabular-nums" style={{ color }}>
              {growthRatePct ? `+${growthRatePct}%` : '—'}
            </p>
          </div>

          <Link
            href={listingAnalyticsHref(row)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{
              borderColor: `${color}7a`,
              color,
              backgroundColor: `${color}17`,
            }}
          >
            <BarChart3 className="size-4" />
            View Detailed Analytics
          </Link>
        </div>
      </div>
    </article>
  );
}

function TrendingWindowChart({
  data,
  color,
  modeDays,
}: {
  data: {
    date: string;
    label: string;
    downloads: number;
    isCurrent: boolean;
  }[];
  color: string;
  modeDays: number;
}) {
  const isClientReady = useClientReady();
  const chartInstanceId = useId();
  if (data.length === 0) return null;
  if (!isClientReady) return <div style={{ height: 220, width: '100%' }} />;

  const chartKey =
    `${data[0]?.date ?? 'na'}-${data[data.length - 1]?.date ?? 'na'}-${modeDays}`.replace(
      /[^a-zA-Z0-9_-]/g,
      '',
    );
  const instanceKey = chartInstanceId.replace(/[^a-zA-Z0-9_-]/g, '');
  const baseGradientId = `trend-base-${color.replace(/[^a-zA-Z0-9_-]/g, '')}-${chartKey}-${instanceKey}`;
  const currGradientId = `trend-curr-${color.replace(/[^a-zA-Z0-9_-]/g, '')}-${chartKey}-${instanceKey}`;
  const prevClipId = `trend-prev-clip-${chartKey}-${instanceKey}`;
  const currClipId = `trend-curr-clip-${chartKey}-${instanceKey}`;
  const firstCurrentIndex = data.findIndex((point) => point.isCurrent);
  const splitIndex =
    firstCurrentIndex === -1 ? data.length - 1 : firstCurrentIndex;
  const splitRatio =
    data.length <= 1
      ? 1
      : Math.min(1, Math.max(0, splitIndex / (data.length - 1)));
  const splitPercent = splitRatio * 100;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px] font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-1.5 w-3 rounded-sm"
            style={{ backgroundColor: `${color}8f` }}
          />
          Previous {modeDays}d
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-1.5 w-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
          Current {modeDays}d
        </span>
      </div>

      <SafeChartContainer height={220}>
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <AreaChart
            data={data}
            margin={{ top: 4, right: 10, bottom: 8, left: 0 }}
          >
            <defs>
              <linearGradient id={baseGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.14} />
                <stop offset="95%" stopColor={color} stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id={currGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.28} />
                <stop offset="95%" stopColor={color} stopOpacity={0.03} />
              </linearGradient>
              <clipPath id={prevClipId}>
                <rect x="0%" y="0%" width={`${splitPercent}%`} height="100%" />
              </clipPath>
              <clipPath id={currClipId}>
                <rect
                  x={`${splitPercent}%`}
                  y="0%"
                  width={`${100 - splitPercent}%`}
                  height="100%"
                />
              </clipPath>
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
              interval="preserveStartEnd"
              tickMargin={6}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const datum = payload[0]?.payload as
                  | { downloads?: number; isCurrent?: boolean }
                  | undefined;
                return (
                  <div className="rounded-lg bg-overlay/75 p-2.5 text-xs text-overlay-fg ring ring-current/10 backdrop-blur-lg">
                    <span className="font-semibold">{label as string}</span>
                    <div className="mt-1">
                      {(datum?.downloads ?? 0).toLocaleString()} downloads
                    </div>
                    <div className="mt-1 text-muted-fg">
                      {datum?.isCurrent
                        ? `Current ${modeDays}d`
                        : `Previous ${modeDays}d`}
                    </div>
                  </div>
                );
              }}
              wrapperStyle={{ outline: 'none' }}
            />
            <Area
              type="monotone"
              dataKey="downloads"
              stroke={color}
              strokeOpacity={0.9}
              strokeWidth={2.2}
              fillOpacity={0}
              connectNulls
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="downloads"
              stroke="none"
              fill={`url(#${baseGradientId})`}
              isAnimationActive={false}
              dot={false}
              clipPath={`url(#${prevClipId})`}
            />
            <Area
              type="monotone"
              dataKey="downloads"
              stroke="none"
              fill={`url(#${currGradientId})`}
              isAnimationActive={false}
              dot={false}
              clipPath={`url(#${currClipId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </SafeChartContainer>
    </div>
  );
}
