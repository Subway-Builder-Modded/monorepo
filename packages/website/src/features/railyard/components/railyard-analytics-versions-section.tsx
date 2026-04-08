'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Layers3 } from 'lucide-react';
import {
  SortableNumberHeader,
  type SortDirection,
} from '@/components/shared/sortable-number-header';
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { usePersistedState } from '@/lib/use-persisted-state';
import type { RailyardAnalyticsData } from '@/types/railyard-analytics';
import {
  compareSemver,
  formatCompactNumber,
  RAILYARD_ACCENT_COLOR,
  RailyardRankBadge,
  RailyardSectionHeader,
  SafeChartContainer,
  useClientReady,
} from './railyard-analytics-shared';

type SortField = 'version' | 'downloads' | 'share' | 'assets';
type VersionPeriod = 'all' | '1' | '3' | '7';

type VersionRow = {
  version: string;
  downloads: number;
  share: number;
  assets: number;
};

function sortRows(
  rows: VersionRow[],
  field: SortField,
  direction: SortDirection,
): VersionRow[] {
  return [...rows].sort((left, right) => {
    if (field === 'version') {
      const cmp = compareSemver(left.version, right.version);
      return direction === 'asc' ? cmp : -cmp;
    }

    const leftValue = left[field];
    const rightValue = right[field];
    if (leftValue !== rightValue) {
      return direction === 'asc'
        ? leftValue - rightValue
        : rightValue - leftValue;
    }

    const fallback = compareSemver(left.version, right.version);
    return direction === 'asc' ? fallback : -fallback;
  });
}

function periodLabel(period: VersionPeriod): string {
  if (period === '1') return 'Last 24 Hours';
  if (period === '3') return 'Last 3 Days';
  if (period === '7') return 'Last Week';
  return 'All Time';
}

function isSubDaily(period: VersionPeriod): boolean {
  return period === '1' || period === '3';
}

function formatTimeLabel(timestamp: string, period: VersionPeriod): string {
  const dt = new Date(timestamp);
  if (Number.isNaN(dt.getTime())) return timestamp;

  if (isSubDaily(period)) {
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    const hour = String(dt.getHours()).padStart(2, '0');
    const minute = String(dt.getMinutes()).padStart(2, '0');
    if (period === '1') return `${hour}:${minute}`;
    return `${month}/${day} ${hour}:${minute}`;
  }

  return timestamp.slice(5).replace('-', '/');
}

function formatTooltipTime(timestamp: string): string {
  const dt = new Date(timestamp);
  if (Number.isNaN(dt.getTime())) return timestamp;
  const hour = String(dt.getHours()).padStart(2, '0');
  const minute = String(dt.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
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

export function RailyardAnalyticsVersionsSection({
  data,
}: {
  data: RailyardAnalyticsData;
}) {
  const isClientReady = useClientReady();
  const [sortField, setSortField] = useState<SortField>('downloads');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [period, setPeriod] = usePersistedState<VersionPeriod>(
    'railyard.analytics.versions.period',
    'all',
  );
  const [activeVersion, setActiveVersion] = usePersistedState<string>(
    'railyard.analytics.versions.active',
    data.summary.latestVersion,
  );
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const versionOrder = useMemo(
    () => [...data.versions].map((row) => row.version).reverse(),
    [data.versions],
  );

  const activeIndex = Math.max(0, versionOrder.indexOf(activeVersion));
  const canGoBack = activeIndex > 0;
  const canGoNext = activeIndex < versionOrder.length - 1;

  useEffect(() => {
    if (!versionOrder.includes(activeVersion) && versionOrder[0]) {
      setActiveVersion(versionOrder[0]);
    }
  }, [activeVersion, setActiveVersion, versionOrder]);

  useEffect(() => {
    if (!carouselApi) return;
    carouselApi.scrollTo(activeIndex);
  }, [activeIndex, carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      const selected = carouselApi.selectedScrollSnap();
      const next = versionOrder[selected];
      if (next) setActiveVersion(next);
    };

    carouselApi.on('select', onSelect);
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi, setActiveVersion, versionOrder]);

  const rows = useMemo<VersionRow[]>(() => {
    const total = data.summary.totalDownloads;
    return data.versions.map((versionRow) => ({
      version: versionRow.version,
      downloads: versionRow.totalDownloads,
      share: total > 0 ? (versionRow.totalDownloads / total) * 100 : 0,
      assets: versionRow.assets.length,
    }));
  }, [data.summary.totalDownloads, data.versions]);

  const sortedRows = useMemo(
    () => sortRows(rows, sortField, sortDirection),
    [rows, sortDirection, sortField],
  );

  const versionDailyMap = useMemo(() => {
    return new Map(data.versionDaily.map((row) => [row.version, row.daily]));
  }, [data.versionDaily]);

  const versionHourlyMap = useMemo(() => {
    return new Map(data.versionHourly.map((row) => [row.version, row.hourly]));
  }, [data.versionHourly]);

  const chartRowsByVersion = useMemo(() => {
    const map = new Map<
      string,
      Array<{ date: string; label: string; downloads: number }>
    >();

    for (const version of versionOrder) {
      if (period === '1' || period === '3') {
        const hourly = [...(versionHourlyMap.get(version) ?? [])]
          .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
          .filter((row) => row.timestamp.slice(5, 10) !== '03-30');

        const hours = period === '1' ? 24 : 72;
        const filtered = hourly.slice(-hours);

        map.set(
          version,
          filtered.map((row) => ({
            date: row.timestamp,
            label: formatTimeLabel(row.timestamp, period),
            downloads: row.downloads,
          })),
        );
        continue;
      }

      const daily = [...(versionDailyMap.get(version) ?? [])]
        .sort((a, b) => a.date.localeCompare(b.date))
        .filter((row) => row.date.slice(5, 10) !== '03-30');

      const filtered = period === 'all' ? daily : daily.slice(-7);

      map.set(
        version,
        filtered.map((row) => ({
          date: row.date,
          label: formatTimeLabel(row.date, period),
          downloads: row.downloads,
        })),
      );
    }

    return map;
  }, [period, versionDailyMap, versionHourlyMap, versionOrder]);

  const toggleSort = (nextField: SortField) => {
    if (nextField === sortField) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(nextField);
    setSortDirection('desc');
  };

  return (
    <section className="mb-12">
      <RailyardSectionHeader icon={Layers3} title="Version Analytics" />

      <div className="mb-8 rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex h-10 items-center gap-1 rounded-lg border border-border/80 bg-background/80 p-0.5">
            <button
              type="button"
              onClick={() => {
                if (!canGoBack) return;
                const nextIndex = Math.max(0, activeIndex - 1);
                const next = versionOrder[nextIndex];
                if (next) setActiveVersion(next);
              }}
              className="inline-flex h-9 items-center rounded-md px-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent/45 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
              disabled={!canGoBack}
            >
              Prev
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-3.5 text-sm font-semibold"
              style={{
                color: RAILYARD_ACCENT_COLOR,
                backgroundColor: `${RAILYARD_ACCENT_COLOR}18`,
              }}
            >
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: RAILYARD_ACCENT_COLOR }}
              />
              v{activeVersion}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!canGoNext) return;
                const nextIndex = Math.min(
                  versionOrder.length - 1,
                  activeIndex + 1,
                );
                const next = versionOrder[nextIndex];
                if (next) setActiveVersion(next);
              }}
              className="inline-flex h-9 items-center rounded-md px-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent/45 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
              disabled={!canGoNext}
            >
              Next
            </button>
          </div>

          <ToggleGroup
            type="single"
            value={period}
            variant="default"
            size="sm"
            spacing={1}
            onValueChange={(next) => {
              if (
                next === 'all' ||
                next === '1' ||
                next === '3' ||
                next === '7'
              ) {
                setPeriod(next);
              }
            }}
            className="h-10 rounded-lg border border-border/80 bg-background/80 p-0.5"
          >
            {[
              ['all', 'All Time'],
              ['1', 'Last 24 Hours'],
              ['3', 'Last 3 Days'],
              ['7', 'Last Week'],
            ].map(([value, label]) => (
              <ToggleGroupItem
                key={value}
                value={value}
                className="h-9 rounded-md px-3.5 text-sm font-semibold text-muted-foreground hover:bg-accent/45 hover:text-primary data-[state=on]:bg-accent/45 data-[state=on]:text-primary"
              >
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Version Downloads ({periodLabel(period)})
        </p>

        <Carousel
          opts={{ align: 'start', loop: false }}
          setApi={setCarouselApi}
          className="w-full"
        >
          <CarouselContent className="ml-0">
            {versionOrder.map((version) => (
              <CarouselItem key={version} className="pl-0">
                <SafeChartContainer height={300}>
                  {isClientReady ? (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      debounce={50}
                    >
                      <AreaChart
                        data={chartRowsByVersion.get(version) ?? []}
                        margin={{ top: 4, right: 12, bottom: 8, left: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id={`railyard-version-${version.replace(/[^a-zA-Z0-9_-]/g, '')}-grad`}
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
                          tick={{
                            fontSize: 10,
                            fill: 'var(--muted-foreground)',
                          }}
                          axisLine={false}
                          tickLine={false}
                          interval={
                            (chartRowsByVersion.get(version)?.length ?? 0) > 14
                              ? 'preserveStartEnd'
                              : 0
                          }
                          tickMargin={6}
                        />
                        <YAxis
                          tick={{
                            fontSize: 10,
                            fill: 'var(--muted-foreground)',
                          }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value: number) =>
                            formatCompactNumber(value)
                          }
                          width={40}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const value = Number(payload[0]?.value ?? 0);
                            const row = payload[0]?.payload as
                              | { date?: string }
                              | undefined;
                            const timestamp = row?.date ?? '';
                            const title = isSubDaily(period)
                              ? formatTooltipTime(timestamp)
                              : (label as string);
                            return (
                              <div className="rounded-lg bg-overlay/95 p-2.5 text-xs text-overlay-fg ring ring-current/20 backdrop-blur-lg">
                                <div className="font-semibold">{title}</div>
                                <div className="mt-1 flex items-center justify-between gap-3">
                                  <span>{`v${version}`}</span>
                                  <span className="font-semibold tabular-nums">
                                    {value.toLocaleString()}
                                  </span>
                                </div>
                                {isSubDaily(period) ? (
                                  <div className="mt-1 text-[11px] text-muted-fg">
                                    {formatLongDate(timestamp)}
                                  </div>
                                ) : null}
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
                          fill={`url(#railyard-version-${version.replace(/[^a-zA-Z0-9_-]/g, '')}-grad)`}
                          dot={false}
                          activeDot={{ r: 3, fill: RAILYARD_ACCENT_COLOR }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : null}
                </SafeChartContainer>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card ring-1 ring-foreground/5">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/35">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Rank
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <SortableNumberHeader
                    label="Version"
                    isActive={sortField === 'version'}
                    direction={sortDirection}
                    accentColor={RAILYARD_ACCENT_COLOR}
                    onToggle={() => toggleSort('version')}
                  />
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <SortableNumberHeader
                    label="Downloads"
                    isActive={sortField === 'downloads'}
                    direction={sortDirection}
                    accentColor={RAILYARD_ACCENT_COLOR}
                    onToggle={() => toggleSort('downloads')}
                  />
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <SortableNumberHeader
                    label="Share"
                    isActive={sortField === 'share'}
                    direction={sortDirection}
                    accentColor={RAILYARD_ACCENT_COLOR}
                    onToggle={() => toggleSort('share')}
                  />
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <SortableNumberHeader
                    label="Assets"
                    isActive={sortField === 'assets'}
                    direction={sortDirection}
                    accentColor={RAILYARD_ACCENT_COLOR}
                    onToggle={() => toggleSort('assets')}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((versionRow, index) => (
                <tr
                  key={versionRow.version}
                  className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30"
                >
                  <td className="px-3 py-2.5">
                    <RailyardRankBadge rank={index + 1} />
                  </td>
                  <td
                    className={`px-3 py-2.5 ${sortField === 'version' ? 'font-black' : 'font-semibold text-foreground'}`}
                    style={
                      sortField === 'version'
                        ? { color: RAILYARD_ACCENT_COLOR }
                        : undefined
                    }
                  >
                    v{versionRow.version}
                  </td>
                  <td
                    className={`px-3 py-2.5 tabular-nums ${sortField === 'downloads' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                    style={
                      sortField === 'downloads'
                        ? { color: RAILYARD_ACCENT_COLOR }
                        : undefined
                    }
                  >
                    {versionRow.downloads.toLocaleString()}
                  </td>
                  <td
                    className={`px-3 py-2.5 tabular-nums ${sortField === 'share' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                    style={
                      sortField === 'share'
                        ? { color: RAILYARD_ACCENT_COLOR }
                        : undefined
                    }
                  >
                    {versionRow.share.toFixed(1)}%
                  </td>
                  <td
                    className={`px-3 py-2.5 tabular-nums ${sortField === 'assets' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                    style={
                      sortField === 'assets'
                        ? { color: RAILYARD_ACCENT_COLOR }
                        : undefined
                    }
                  >
                    {versionRow.assets}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
