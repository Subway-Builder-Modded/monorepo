'use client';

import { useMemo, type CSSProperties } from 'react';
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
  Activity,
  Eye,
  Globe2,
  type LucideIcon,
  MonitorSmartphone,
  MousePointer,
  Timer,
} from 'lucide-react';
import type {
  WebsiteAnalyticsData,
  WebsiteAnalyticsPeriod,
} from '@/types/website-analytics';
import { usePersistedState } from '@/lib/use-persisted-state';
import {
  EmptyState,
  SafeChartContainer,
  WEBSITE_ACCENT_COLOR,
  WebsitePeriodToggle,
  WebsiteSectionHeader,
  formatCompactNumber,
  useClientReady,
} from './website-shared';

const ICON_STYLE: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--primary) 35%, transparent)',
  backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
  color: 'var(--primary)',
};

function parseUtcDateOnly(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;
  const [, year, month, day] = match;
  const parsed = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0),
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseSnapshotUtc(label: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}) UTC$/.exec(
    label.trim(),
  );
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const parsed = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      0,
      0,
    ),
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatUtcDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatUtcDateTime(date: Date): string {
  const datePart = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${datePart} ${timePart}`;
}

function TrendChart({
  data,
  period,
}: {
  data: WebsiteAnalyticsData['timeseries'];
  period: WebsiteAnalyticsPeriod;
}) {
  const isClientReady = useClientReady();

  if (data.length === 0) {
    return (
      <EmptyState
        title="No trend data"
        description="Add a timeseries snapshot to visualize website traffic over time."
      />
    );
  }

  if (!isClientReady) {
    return <div style={{ height: 270, width: '100%' }} />;
  }

  const dayCount =
    period === '1d' ? 2 : period === '7d' ? 7 : period === '30d' ? 30 : 0;
  const sourceRows = dayCount > 0 ? data.slice(-dayCount) : data;

  const chartRows = sourceRows.map((row) => {
    const [, month, day] = row.date.split('-');
    return {
      label: `${month}/${day}`,
      visits: row.visitors,
    };
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Traffic Trend
      </p>
      <SafeChartContainer height={270}>
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <AreaChart
            data={chartRows}
            margin={{ top: 4, right: 10, bottom: 8, left: 0 }}
          >
            <defs>
              <linearGradient
                id="website-pv-gradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={WEBSITE_ACCENT_COLOR}
                  stopOpacity={0.32}
                />
                <stop
                  offset="95%"
                  stopColor={WEBSITE_ACCENT_COLOR}
                  stopOpacity={0.04}
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
              interval="preserveStartEnd"
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
                const visits = Number(payload[0]?.value ?? 0);
                return (
                  <div className="rounded-lg bg-overlay/75 p-2.5 text-xs text-overlay-fg ring ring-current/10 backdrop-blur-lg">
                    <span className="font-semibold">{label as string}</span>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span className="text-muted-fg">Visits</span>
                      <span className="font-semibold tabular-nums">
                        {visits.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              }}
              wrapperStyle={{ outline: 'none' }}
            />
            <Area
              type="monotone"
              dataKey="visits"
              stroke={WEBSITE_ACCENT_COLOR}
              strokeWidth={2.2}
              fill="url(#website-pv-gradient)"
              dot={false}
              activeDot={{ r: 3, fill: WEBSITE_ACCENT_COLOR }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </SafeChartContainer>
    </div>
  );
}

function OverviewCard({
  icon: Icon,
  label,
  value,
  subValue,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  subValue: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 ring-1 ring-foreground/5 ${className ?? ''}`}
    >
      <div
        className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-md border"
        style={ICON_STYLE}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 truncate text-lg font-bold text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{subValue}</p>
    </div>
  );
}

export function WebsiteOverviewSection({
  data,
}: {
  data: WebsiteAnalyticsData;
}) {
  const [period, setPeriod] = usePersistedState<WebsiteAnalyticsPeriod>(
    'website.analytics.overview.period',
    'all',
  );

  const periodLabel = useMemo(() => {
    if (period === '1d') return 'Last Day';
    if (period === '7d') return 'Last Week';
    if (period === '30d') return 'Last Month';
    return 'Last Year';
  }, [period]);

  const periodSummary = useMemo(() => {
    const topPage = [...data.pages].sort(
      (a, b) => b.pageviews[period] - a.pageviews[period],
    )[0];
    const topCountry = [...data.countries].sort(
      (a, b) => b.visitors[period] - a.visitors[period],
    )[0];
    const topDevice = [...data.devices].sort(
      (a, b) => b.visits[period] - a.visits[period],
    )[0];

    return {
      visits: data.pages.reduce((sum, row) => sum + row.pageviews[period], 0),
      topPage: topPage?.path ?? data.summary.topPage,
      topPageVisits: topPage?.pageviews[period] ?? 0,
      topCountry: topCountry?.country ?? data.summary.topCountry,
      topCountryVisits: topCountry?.visitors[period] ?? 0,
      topDevice: topDevice?.device ?? data.summary.topDevice,
      topDeviceVisits:
        topDevice?.visits[period] ?? data.summary.topDeviceVisitors,
    };
  }, [data, period]);

  const periodCoverageLabel = useMemo(() => {
    const sortedDates = data.timeseries
      .map((row) => row.date)
      .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
      .sort((a, b) => a.localeCompare(b));

    const firstDate = sortedDates[0];
    const lastDate = sortedDates[sortedDates.length - 1];

    if (!firstDate || !lastDate) {
      return data.snapshotLabel;
    }

    const firstDayUtc = parseUtcDateOnly(firstDate);
    const lastDayUtc = parseUtcDateOnly(lastDate);

    if (!firstDayUtc || !lastDayUtc) {
      return data.snapshotLabel;
    }

    if (period === '1d') {
      const snapshotUtc = parseSnapshotUtc(data.snapshotLabel);
      if (snapshotUtc) {
        const startUtc = new Date(snapshotUtc.getTime() - 24 * 60 * 60 * 1000);
        return `${formatUtcDateTime(startUtc)} UTC to ${formatUtcDateTime(snapshotUtc)} UTC`;
      }

      const fallbackEnd = new Date(
        lastDayUtc.getTime() + 23 * 60 * 60 * 1000 + 59 * 60 * 1000,
      );
      return `${formatUtcDate(lastDayUtc)} 00:00 to ${formatUtcDateTime(fallbackEnd)} UTC`;
    }

    const days = period === '7d' ? 8 : period === '30d' ? 30 : 0;
    if (days === 0) {
      return `${formatUtcDate(firstDayUtc)} to ${formatUtcDate(lastDayUtc)}`;
    }

    const rangeStartUtc = new Date(
      lastDayUtc.getTime() - (days - 1) * 24 * 60 * 60 * 1000,
    );
    const clampedStart =
      rangeStartUtc < firstDayUtc ? firstDayUtc : rangeStartUtc;
    return `${formatUtcDate(clampedStart)} to ${formatUtcDate(lastDayUtc)}`;
  }, [data.snapshotLabel, data.timeseries, period]);

  return (
    <section className="mb-12">
      <WebsiteSectionHeader icon={Activity} title="Overview" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <WebsitePeriodToggle value={period} onChange={setPeriod} includeAll />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <OverviewCard
          icon={Eye}
          label="Visits"
          value={periodSummary.visits.toLocaleString()}
          subValue={`visits ${periodLabel.toLowerCase()}`}
        />
        <OverviewCard
          icon={MousePointer}
          label="Top Page"
          value={periodSummary.topPage}
          subValue={`${periodSummary.topPageVisits.toLocaleString()} visits`}
        />
        <OverviewCard
          icon={Globe2}
          label="Top Country"
          value={periodSummary.topCountry}
          subValue={`${periodSummary.topCountryVisits.toLocaleString()} visits`}
        />
      </div>

      <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <TrendChart data={data.timeseries} period={period} />
        <div className="grid gap-4 lg:h-full lg:grid-rows-2">
          <OverviewCard
            icon={MonitorSmartphone}
            label="Top Device"
            value={periodSummary.topDevice}
            subValue={`${periodSummary.topDeviceVisits.toLocaleString()} visits`}
            className="h-full"
          />
          <OverviewCard
            icon={Timer}
            label="Data Period"
            value={periodLabel}
            subValue={periodCoverageLabel}
            className="h-full"
          />
        </div>
      </div>
    </section>
  );
}
