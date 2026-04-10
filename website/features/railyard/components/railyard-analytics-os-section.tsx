'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MonitorCog } from 'lucide-react';
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
import { ToggleGroup, ToggleGroupItem } from '@subway-builder-modded/shared-ui';
import { usePersistedState } from '@/lib/use-persisted-state';
import type { RailyardAnalyticsData } from '@/types/railyard-analytics';
import {
  formatCompactNumber,
  RAILYARD_OS_COLORS,
  RailyardRankBadge,
  RailyardSectionHeader,
  SafeChartContainer,
  useClientReady,
} from './railyard-analytics-shared';

type TimelinePeriod = 'all' | '1' | '3' | '7' | '14';
type OsKey = 'all' | 'windows' | 'macos' | 'linux';
type OsField = 'build' | 'os' | 'downloads' | 'share';

type OsConfig = {
  key: OsKey;
  label: string;
  stroke: string;
  dotColor: string;
  bgClass: string;
  ringClass: string;
  borderClass: string;
};

type OsAssetRow = {
  id: string;
  os: string;
  build: string;
  downloads: number;
  share: number;
};

const OS_CONFIGS: OsConfig[] = [
  {
    key: 'all',
    label: 'All',
    stroke: '#19D89C',
    dotColor: '#19D89C',
    bgClass: 'bg-primary/6',
    ringClass: 'ring-primary/20',
    borderClass: 'border-primary/25',
  },
  {
    key: 'windows',
    label: 'Windows',
    stroke: RAILYARD_OS_COLORS.windows,
    dotColor: '#3b82f6',
    bgClass: 'bg-blue-500/6',
    ringClass: 'ring-blue-500/20',
    borderClass: 'border-blue-500/25',
  },
  {
    key: 'macos',
    label: 'macOS',
    stroke: RAILYARD_OS_COLORS.macos,
    dotColor: '#eab308',
    bgClass: 'bg-yellow-500/7',
    ringClass: 'ring-yellow-500/20',
    borderClass: 'border-yellow-500/25',
  },
  {
    key: 'linux',
    label: 'Linux',
    stroke: RAILYARD_OS_COLORS.linux,
    dotColor: '#ef4444',
    bgClass: 'bg-red-500/6',
    ringClass: 'ring-red-500/20',
    borderClass: 'border-red-500/25',
  },
];

function isSubDaily(period: TimelinePeriod): boolean {
  return period === '1' || period === '3';
}

function periodLabel(period: TimelinePeriod): string {
  if (period === '1') return 'Last 24 Hours';
  if (period === '3') return 'Last 3 Days';
  if (period === '7') return 'Last Week';
  if (period === '14') return 'Last 2 Weeks';
  return 'All Time';
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

function packageLabel(packageType: string, assetLabel: string): string {
  if (/installer/i.test(assetLabel)) return 'Installer';
  if (/portable/i.test(assetLabel)) return 'Portable';
  if (/appimage/i.test(assetLabel)) return 'AppImage';
  if (/flatpak/i.test(assetLabel)) return 'Flatpak';
  if (packageType === 'DMG') return 'DMG';
  if (packageType === 'ZIP') return 'ZIP';
  if (packageType === 'EXE') return 'Installer';
  return packageType;
}

function buildLabel(args: {
  arch: string;
  packageType: string;
  version: string;
  assetLabel: string;
}): string {
  const normalizedArch = args.arch.toLowerCase();
  const arch =
    normalizedArch === 'unknown'
      ? 'Unknown'
      : normalizedArch === 'arm64'
        ? 'ARM64'
        : normalizedArch === 'x64'
          ? 'x64'
          : normalizedArch === 'universal'
            ? 'Universal'
            : args.arch;
  const pkg = packageLabel(args.packageType, args.assetLabel);
  return `${arch} (${pkg}) - v${args.version}`;
}

function sortOsRows(
  rows: OsAssetRow[],
  field: OsField,
  direction: SortDirection,
): OsAssetRow[] {
  return [...rows].sort((a, b) => {
    if (field === 'build') {
      return direction === 'asc'
        ? a.build.localeCompare(b.build)
        : b.build.localeCompare(a.build);
    }

    if (field === 'os') {
      return direction === 'asc'
        ? a.os.localeCompare(b.os)
        : b.os.localeCompare(a.os);
    }

    const lv = a[field];
    const rv = b[field];
    if (lv !== rv) {
      return direction === 'asc' ? lv - rv : rv - lv;
    }

    return b.build.localeCompare(a.build);
  });
}

export function RailyardAnalyticsOsSection({
  data,
}: {
  data: RailyardAnalyticsData;
}) {
  const isClientReady = useClientReady();
  const [period, setPeriod] = usePersistedState<TimelinePeriod>(
    'railyard.analytics.os.period',
    'all',
  );
  const [activeOs, setActiveOs] = usePersistedState<OsKey>(
    'railyard.analytics.os.active',
    'all',
  );
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [carouselHeight, setCarouselHeight] = useState<number | null>(null);
  const slideRefs = useRef<Record<OsKey, HTMLDivElement | null>>({
    all: null,
    windows: null,
    macos: null,
    linux: null,
  });
  const [sortState, setSortState] = useState<
    Record<OsKey, { field: OsField; direction: SortDirection }>
  >({
    all: { field: 'downloads', direction: 'desc' },
    windows: { field: 'downloads', direction: 'desc' },
    macos: { field: 'downloads', direction: 'desc' },
    linux: { field: 'downloads', direction: 'desc' },
  });

  const activeIndex = Math.max(
    0,
    OS_CONFIGS.findIndex((item) => item.key === activeOs),
  );

  useEffect(() => {
    if (!carouselApi) return;
    carouselApi.scrollTo(activeIndex);
  }, [activeIndex, carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      const selected = carouselApi.selectedScrollSnap();
      const next = OS_CONFIGS[selected]?.key;
      if (next) setActiveOs(next);
    };

    carouselApi.on('select', onSelect);
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi, setActiveOs]);

  useEffect(() => {
    const activeNode = slideRefs.current[activeOs];
    if (!activeNode) return;

    const measure = () => {
      const nextHeight = activeNode.getBoundingClientRect().height;
      setCarouselHeight(nextHeight > 0 ? Math.ceil(nextHeight) : null);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(activeNode);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [activeOs, period, sortState]);

  const periodSeriesForTotals = useMemo(() => {
    const source = isSubDaily(period)
      ? data.osHourlyTotals
      : data.osDailyTotals;
    const sorted = [...source].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp),
    );

    const filtered =
      period === 'all'
        ? sorted
        : sorted.slice(
            -(period === '1'
              ? 24
              : period === '3'
                ? 72
                : Number.parseInt(period, 10)),
          );

    return filtered.map((row) => ({
      ...row,
      windows: Math.round(row.windows),
      macos: Math.round(row.macos),
      linux: Math.round(row.linux),
      downloads: Math.round(row.downloads),
    }));
  }, [data.osDailyTotals, data.osHourlyTotals, period]);

  const periodSeries = useMemo(() => {
    const filtered = periodSeriesForTotals.filter(
      (row) => row.timestamp.slice(5, 10) !== '03-30',
    );

    return filtered.map((row) => ({
      ...row,
      label: formatTimeLabel(row.timestamp, period),
    }));
  }, [period, periodSeriesForTotals]);

  const osTables = useMemo(() => {
    const makeRows = (osLabel: 'Windows' | 'macOS' | 'Linux') => {
      const raw = data.versions.flatMap((version) =>
        version.assets
          .filter((asset) => asset.os === osLabel)
          .map((asset) => ({
            id: `${version.version}-${asset.assetName}`,
            os: osLabel,
            build: buildLabel({
              arch: asset.arch,
              packageType: asset.packageType,
              version: version.version,
              assetLabel: asset.assetLabel,
            }),
            downloads: asset.totalDownloads,
          })),
      );

      const total = raw.reduce((sum, row) => sum + row.downloads, 0);
      return raw.map((row) => ({
        ...row,
        share: total > 0 ? (row.downloads / total) * 100 : 0,
      }));
    };

    return {
      windows: makeRows('Windows'),
      macos: makeRows('macOS'),
      linux: makeRows('Linux'),
      all: [...makeRows('Windows'), ...makeRows('macOS'), ...makeRows('Linux')],
    };
  }, [data.versions]);

  const totals = useMemo(
    () =>
      periodSeriesForTotals.reduce(
        (acc, row) => {
          acc.windows += row.windows;
          acc.macos += row.macos;
          acc.linux += row.linux;
          acc.downloads += row.downloads;
          return acc;
        },
        { windows: 0, macos: 0, linux: 0, downloads: 0 },
      ),
    [periodSeriesForTotals],
  );

  const xInterval =
    periodSeries.length > (isSubDaily(period) ? 12 : 14)
      ? 'preserveStartEnd'
      : 0;

  const setSort = (os: OsKey, field: OsField) => {
    setSortState((prev) => {
      const current = prev[os];
      if (current.field === field) {
        return {
          ...prev,
          [os]: {
            field,
            direction: current.direction === 'asc' ? 'desc' : 'asc',
          },
        };
      }

      return {
        ...prev,
        [os]: { field, direction: 'desc' },
      };
    });
  };

  return (
    <section className="mb-12">
      <RailyardSectionHeader icon={MonitorCog} title="OS Breakdown" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex h-10 items-center gap-1 rounded-lg border border-border/80 bg-background/80 p-0.5">
          {OS_CONFIGS.map((os) => {
            const isActive = activeOs === os.key;
            return (
              <button
                key={os.key}
                type="button"
                onClick={() => setActiveOs(os.key)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md px-3.5 text-sm font-semibold transition-colors"
                style={
                  isActive
                    ? {
                        color: os.stroke,
                        backgroundColor: `${os.stroke}18`,
                      }
                    : undefined
                }
              >
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: os.dotColor }}
                />
                {os.label}
              </button>
            );
          })}
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
              next === '7' ||
              next === '14'
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
            ['14', 'Last 2 Weeks'],
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

      <Carousel
        opts={{ align: 'start', loop: false, containScroll: 'trimSnaps' }}
        setApi={setCarouselApi}
        className="w-full overflow-hidden transition-[height] duration-200"
        style={carouselHeight ? { height: `${carouselHeight}px` } : undefined}
      >
        <CarouselContent className="!ml-0">
          {OS_CONFIGS.map((os) => {
            const state = sortState[os.key];
            const sortedRows = sortOsRows(
              osTables[os.key],
              state.field,
              state.direction,
            );
            const total = os.key === 'all' ? totals.downloads : totals[os.key];
            const share =
              totals.downloads > 0 ? (total / totals.downloads) * 100 : 0;

            return (
              <CarouselItem key={os.key} className="!pl-0">
                <div
                  ref={(node) => {
                    slideRefs.current[os.key] = node;
                  }}
                  className={`rounded-xl border ${os.borderClass} ${os.bgClass} p-5 ring-1 ${os.ringClass}`}
                >
                  <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {os.label} Downloads
                      </p>
                      <p className="mt-1 text-2xl font-black text-foreground">
                        {Math.round(total).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {share.toFixed(1)}% share ({periodLabel(period)})
                      </p>
                    </div>
                  </div>

                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {os.label} Downloads ({periodLabel(period)})
                  </p>

                  <SafeChartContainer height={250}>
                    {isClientReady ? (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                        debounce={50}
                      >
                        {os.key === 'all' ? (
                          <LineChart
                            data={periodSeries}
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
                              tick={{
                                fontSize: 10,
                                fill: 'var(--muted-foreground)',
                              }}
                              axisLine={false}
                              tickLine={false}
                              interval={xInterval}
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
                                const row = payload[0]?.payload as
                                  | { timestamp?: string }
                                  | undefined;
                                const timestamp = row?.timestamp ?? '';
                                const title = isSubDaily(period)
                                  ? formatTooltipTime(timestamp)
                                  : (label as string);

                                return (
                                  <div className="rounded-lg bg-overlay/95 p-2.5 text-xs text-overlay-fg ring ring-current/20 backdrop-blur-lg">
                                    <div className="font-semibold">{title}</div>
                                    {payload.map((entry) => (
                                      <div
                                        key={entry.dataKey as string}
                                        className="mt-1 flex items-center justify-between gap-3"
                                      >
                                        <span>{String(entry.name)}</span>
                                        <span className="font-semibold tabular-nums">
                                          {Math.round(
                                            Number(entry.value ?? 0),
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                    ))}
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
                            <Line
                              type="monotone"
                              dataKey="windows"
                              name="Windows"
                              stroke={RAILYARD_OS_COLORS.windows}
                              strokeWidth={2.3}
                              dot={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="macos"
                              name="macOS"
                              stroke={RAILYARD_OS_COLORS.macos}
                              strokeWidth={2.3}
                              dot={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="linux"
                              name="Linux"
                              stroke={RAILYARD_OS_COLORS.linux}
                              strokeWidth={2.3}
                              dot={false}
                            />
                          </LineChart>
                        ) : (
                          <AreaChart
                            data={periodSeries}
                            margin={{ top: 8, right: 14, bottom: 8, left: 0 }}
                          >
                            <defs>
                              <linearGradient
                                id={`railyard-os-${os.key}-grad`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor={os.stroke}
                                  stopOpacity={0.26}
                                />
                                <stop
                                  offset="95%"
                                  stopColor={os.stroke}
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
                              interval={xInterval}
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
                                  | { timestamp?: string }
                                  | undefined;
                                const timestamp = row?.timestamp ?? '';
                                const title = isSubDaily(period)
                                  ? formatTooltipTime(timestamp)
                                  : (label as string);
                                return (
                                  <div className="rounded-lg bg-overlay/95 p-2.5 text-xs text-overlay-fg ring ring-current/20 backdrop-blur-lg">
                                    <div className="font-semibold">{title}</div>
                                    <div className="mt-1 flex items-center justify-between gap-3">
                                      <span>{os.label}</span>
                                      <span className="font-semibold tabular-nums">
                                        {Math.round(value).toLocaleString()}
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
                              dataKey={os.key}
                              stroke={os.stroke}
                              strokeWidth={2.5}
                              fill={`url(#railyard-os-${os.key}-grad)`}
                              dot={false}
                              activeDot={{ r: 3, fill: os.stroke }}
                            />
                          </AreaChart>
                        )}
                      </ResponsiveContainer>
                    ) : null}
                  </SafeChartContainer>

                  <div className="mt-4 overflow-hidden rounded-lg border border-border/70 bg-card/80">
                    <table className="min-w-full text-xs">
                      <thead className="bg-muted/35">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                            Rank
                          </th>
                          <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                            <SortableNumberHeader
                              label="Build"
                              isActive={state.field === 'build'}
                              direction={state.direction}
                              accentColor={os.stroke}
                              onToggle={() => setSort(os.key, 'build')}
                            />
                          </th>
                          {os.key === 'all' ? (
                            <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                              <SortableNumberHeader
                                label="OS"
                                isActive={state.field === 'os'}
                                direction={state.direction}
                                accentColor={os.stroke}
                                onToggle={() => setSort(os.key, 'os')}
                              />
                            </th>
                          ) : null}
                          <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                            <SortableNumberHeader
                              label="Downloads"
                              isActive={state.field === 'downloads'}
                              direction={state.direction}
                              accentColor={os.stroke}
                              onToggle={() => setSort(os.key, 'downloads')}
                            />
                          </th>
                          <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                            <SortableNumberHeader
                              label="Share"
                              isActive={state.field === 'share'}
                              direction={state.direction}
                              accentColor={os.stroke}
                              onToggle={() => setSort(os.key, 'share')}
                            />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRows.map((row, index) => (
                          <tr
                            key={row.id}
                            className="border-t border-border/60"
                          >
                            <td className="px-3 py-2">
                              <RailyardRankBadge rank={index + 1} />
                            </td>
                            <td
                              className={`px-3 py-2 max-w-[24rem] truncate ${state.field === 'build' ? 'font-black' : 'font-medium text-foreground'}`}
                              style={
                                state.field === 'build'
                                  ? { color: os.stroke }
                                  : undefined
                              }
                            >
                              {row.build}
                            </td>
                            {os.key === 'all' ? (
                              <td
                                className={`px-3 py-2 ${state.field === 'os' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                                style={
                                  state.field === 'os'
                                    ? { color: os.stroke }
                                    : undefined
                                }
                              >
                                {row.os}
                              </td>
                            ) : null}
                            <td
                              className={`px-3 py-2 tabular-nums ${state.field === 'downloads' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                              style={
                                state.field === 'downloads'
                                  ? { color: os.stroke }
                                  : undefined
                              }
                            >
                              {row.downloads.toLocaleString()}
                            </td>
                            <td
                              className={`px-3 py-2 tabular-nums ${state.field === 'share' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                              style={
                                state.field === 'share'
                                  ? { color: os.stroke }
                                  : undefined
                              }
                            >
                              {row.share.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
