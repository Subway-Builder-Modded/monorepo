'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ToggleGroup, ToggleGroupItem } from '@subway-builder-modded/shared-ui';
import { cn } from '@subway-builder-modded/shared-ui';
import { AuthorName } from '@/components/shared/author-name';
import {
  getAuthorAttributionHref as resolveAuthorAttributionHref,
  getAuthorDisplayName as resolveAuthorDisplayName,
  isExternalHref as checkExternalHref,
} from '@/lib/authors';
import type { DailyDataPoint, ListingType } from '@/types/registry-analytics';

// ---------------------------------------------------------------------------
// Color constants — purple = UI chrome, red = mods data, blue = maps data
// ---------------------------------------------------------------------------

/** Deep red — all mod-specific data visualizations. */
export const MOD_COLOR = '#e03131';
/** Deep blue — all map-specific data visualizations. */
export const MAP_COLOR = '#1c7ed6';

export function getListingColor(type: ListingType): string {
  return type === 'mod' ? MOD_COLOR : MAP_COLOR;
}

// ---------------------------------------------------------------------------
// Section header — purple by default, or type-accented with hex `accent` prop
// ---------------------------------------------------------------------------

export function SectionHeader({
  icon: Icon,
  title,
  accent,
}: {
  icon: LucideIcon;
  title: string;
  /** Hex color string for type-specific sections (e.g. MOD_COLOR / MAP_COLOR). */
  accent?: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span
        className={cn(
          'inline-flex size-8 shrink-0 items-center justify-center rounded-md border',
          !accent && 'border-primary/40 bg-primary/10 text-primary',
        )}
        style={
          accent
            ? {
                borderColor: `${accent}59`,
                backgroundColor: `${accent}1a`,
                color: accent,
              }
            : undefined
        }
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </h2>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Type badge
// ---------------------------------------------------------------------------

export function TypeBadge({
  type,
  size = 'default',
}: {
  type: ListingType;
  size?: 'default' | 'sm';
}) {
  const cls =
    size === 'sm' ? 'px-1 py-0 text-[9px]' : 'px-1.5 py-0.5 text-[10px]';
  const color = type === 'mod' ? MOD_COLOR : MAP_COLOR;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-sm border font-semibold uppercase tracking-wider',
        cls,
      )}
      style={{
        borderColor: `${color}59`,
        backgroundColor: `${color}1a`,
        color,
      }}
    >
      {type}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Rank badge — always purple (aggregate UI element)
// ---------------------------------------------------------------------------

export function RankBadge({ rank }: { rank: number }) {
  // Gold / silver / bronze medals for top 3
  const medal =
    rank === 1
      ? {
          borderColor: '#f59e0b66',
          backgroundColor: '#f59e0b1a',
          color: '#d97706',
        }
      : rank === 2
        ? {
            borderColor: '#94a3b866',
            backgroundColor: '#94a3b81a',
            color: '#64748b',
          }
        : rank === 3
          ? {
              borderColor: '#c2713666',
              backgroundColor: '#c271361a',
              color: '#b45309',
            }
          : null;

  return (
    <span
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center rounded-sm border text-xs font-bold tabular-nums',
        !medal && 'border-border bg-muted/50 text-muted-foreground',
      )}
      style={medal ?? undefined}
    >
      {rank}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Shared recharts tooltip
// ---------------------------------------------------------------------------

type TooltipEntry = {
  value?: number | string;
  payload?: Record<string, unknown>;
};

export function RegistryTooltip({
  active,
  payload: rawPayload,
  label,
  valuePrefix = '',
  valueSuffix = '',
}: {
  active?: boolean;
  payload?: unknown[];
  label?: unknown;
  valuePrefix?: string;
  valueSuffix?: string;
}) {
  if (!active || !rawPayload?.length) return null;
  const item = rawPayload[0] as TooltipEntry;
  const entry = (item.payload ?? {}) as Record<string, unknown>;

  return (
    <div className="grid min-w-44 items-start rounded-lg bg-overlay/75 p-3 py-2 text-overlay-fg text-xs ring ring-current/10 backdrop-blur-lg">
      <span className="font-medium">
        {(entry['fullName'] as string | undefined) ?? String(label ?? '')}
      </span>
      <span className="mt-2 mb-1 block h-px w-full bg-current/10" />
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-fg">Downloads</span>
        <span className="font-semibold font-mono tabular-nums">
          {valuePrefix}
          {Number(item.value ?? 0).toLocaleString()}
          {valueSuffix}
        </span>
      </div>
      {entry['author'] ? (
        <div className="mt-1 flex items-center justify-between gap-4">
          <span className="text-muted-fg">Author</span>
          <AuthorName
            author={{
              author: entry['author'] as string,
              author_alias: entry['author_alias'] as string | undefined,
              contributor_tier: entry['contributor_tier'] as
                | 'developer'
                | 'engineer'
                | 'conductor'
                | 'executive'
                | undefined,
            }}
            className="justify-end"
            nameClassName="font-medium"
          />
        </div>
      ) : null}
      {entry['type'] ? (
        <div className="mt-1 flex items-center justify-between gap-4">
          <span className="text-muted-fg">Type</span>
          <TypeBadge type={entry['type'] as ListingType} size="sm" />
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Period tab switcher
// ---------------------------------------------------------------------------

export type PeriodKey = 'all' | '1d' | '3d' | '7d';

const PERIODS: { value: PeriodKey; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: '1d', label: 'Last Day' },
  { value: '3d', label: 'Last 3 Days' },
  { value: '7d', label: 'Last Week' },
];

export function PeriodToggle({
  value,
  onChange,
}: {
  value: PeriodKey;
  onChange: (v: PeriodKey) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      variant="default"
      size="sm"
      spacing={1}
      onValueChange={(v) => {
        if (v) onChange(v as PeriodKey);
      }}
      className="h-10 rounded-xl border border-border/70 bg-background/90 p-0.5 shadow-sm backdrop-blur-md"
    >
      {PERIODS.map(({ value: pv, label }) => (
        <ToggleGroupItem
          key={pv}
          value={pv}
          className="h-9 rounded-lg px-3.5 text-sm font-semibold text-muted-foreground hover:bg-accent/45 hover:text-primary data-[state=on]:bg-accent/45 data-[state=on]:text-primary"
        >
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

// ---------------------------------------------------------------------------
// Number formatter
// ---------------------------------------------------------------------------

export function formatCount(n: number): string {
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

export function truncateName(name: string, max = 24): string {
  return name.length <= max ? name : `${name.slice(0, max - 1)}\u2026`;
}

export function getAuthorDisplayName(author: {
  author: string;
  author_alias?: string;
}): string {
  return resolveAuthorDisplayName(author);
}

export function getAuthorAttributionHref(author: {
  author: string;
  attribution_link?: string;
}): string {
  return resolveAuthorAttributionHref(author);
}

export function isExternalHref(href: string): boolean {
  return checkExternalHref(href);
}

export function trimLeadingZeroDailyData(
  data: DailyDataPoint[],
): DailyDataPoint[] {
  const firstNonZeroIndex = data.findIndex((point) => point.downloads > 0);
  if (firstNonZeroIndex <= 0) return data;
  return data.slice(firstNonZeroIndex);
}

export function registryLinkStyle(accent: string): CSSProperties {
  return { ['--link-accent' as string]: accent };
}

export const REGISTRY_LINK_HOVER_CLS =
  'text-foreground underline-offset-4 transition-colors hover:text-[var(--link-accent)] hover:underline hover:decoration-[var(--link-accent)]';

export function useClientReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  return isReady;
}

// ---------------------------------------------------------------------------
// Shared table styles
// ---------------------------------------------------------------------------

export const TABLE_HEADER_CLS =
  'px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground';
export const TABLE_HEADER_RIGHT_CLS =
  'px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground';
export const TABLE_CELL_CLS = 'px-3 py-2.5 text-left';
export const TABLE_CELL_NUMERIC_CLS = 'px-3 py-2.5 text-left tabular-nums';
export const TABLE_ROW_CLS =
  'border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30';

export function SearchField({
  placeholder,
  value,
  onChange,
  className,
}: {
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-border/80 bg-muted/20 pl-9 pr-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/60 focus:border-primary/45 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

export function SafeChartContainer({
  height,
  children,
}: {
  height: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const checkSize = () => {
      const { width, height: h } = node.getBoundingClientRect();
      setIsReady(width > 0 && h > 0);
    };

    checkSize();
    const observer = new ResizeObserver(checkSize);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ height, width: '100%', minWidth: 0, minHeight: height }}
    >
      {isReady ? children : null}
    </div>
  );
}

export function RegistryFilterControls({
  period,
  onPeriodChange,
  query,
  onQueryChange,
  searchPlaceholder,
}: {
  period?: PeriodKey;
  onPeriodChange?: (next: PeriodKey) => void;
  query: string;
  onQueryChange: (next: string) => void;
  searchPlaceholder: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      {period && onPeriodChange ? (
        <PeriodToggle value={period} onChange={onPeriodChange} />
      ) : (
        <div />
      )}
      <SearchField
        placeholder={searchPlaceholder}
        value={query}
        onChange={onQueryChange}
        className="min-w-64 flex-1 sm:max-w-md"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Registry detail shell — wraps author and listing detail pages
// ---------------------------------------------------------------------------

export function RegistryDetailShell({
  title,
  subtitle,
  type,
  snapshotLabel,
  backHref = '/registry',
  actions,
  showTypeBadge = true,
  metadataBadges = [],
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Listing type — sets the accent color. Omit for author pages (uses purple). */
  type?: ListingType;
  snapshotLabel: string;
  backHref?: string;
  actions?: ReactNode;
  showTypeBadge?: boolean;
  metadataBadges?: Array<{
    icon: LucideIcon;
    value: string;
    tooltip: string;
  }>;
  children: ReactNode;
}) {
  const accentColor = type ? getListingColor(type) : 'var(--primary)';
  const backButtonStyle = {
    borderColor: accentColor,
    color: accentColor,
    backgroundColor: 'transparent',
    ['--back-accent' as string]: accentColor,
    ['--back-soft' as string]: `color-mix(in srgb, ${accentColor} 18%, transparent)`,
  };
  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero card with type-colored accent strip */}
      <div className="mb-8 overflow-visible rounded-xl border border-border bg-card shadow-sm">
        <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />
        <div className="px-5 py-5 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Link
              href={backHref}
              className="group inline-flex h-10 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold transition-colors duration-200 ease-out hover:!bg-[var(--back-soft)] hover:!text-[var(--back-accent)]"
              style={backButtonStyle}
              aria-label="Go back"
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>
            <div className="flex items-center gap-1.5">{actions}</div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {type && showTypeBadge ? (
                <div className="mb-2">
                  <TypeBadge type={type} />
                </div>
              ) : null}
              <h1 className="text-3xl font-black leading-[1.08] tracking-tight text-foreground sm:text-4xl">
                {title}
              </h1>
              {subtitle ? (
                <div className="mt-1 text-sm text-muted-foreground">
                  {subtitle}
                </div>
              ) : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground">
                Updated:{' '}
                <code className="rounded bg-foreground/8 px-1 font-mono text-[0.85em]">
                  {snapshotLabel}
                </code>
              </p>
              {metadataBadges.length > 0 ? (
                <div className="mt-2 flex flex-col items-end gap-1.5">
                  {metadataBadges.map((badge, index) => (
                    <div
                      key={`${badge.value}-${index}`}
                      className="group relative inline-flex"
                    >
                      <div className="inline-flex cursor-default items-center gap-1.5 rounded-md border border-border/70 bg-card/70 px-2 py-1 text-xs text-foreground/90">
                        <badge.icon className="size-3.5 text-[#1c7ed6]" />
                        <span className="font-semibold">{badge.value}</span>
                      </div>
                      <div className="pointer-events-none absolute right-0 top-full z-30 mt-2 hidden min-w-max rounded-lg bg-overlay/75 p-2.5 text-xs text-overlay-fg ring ring-current/10 backdrop-blur-lg group-hover:block group-focus-within:block">
                        <span className="inline-flex items-center gap-2">
                          <badge.icon className="size-3.5 text-[#1c7ed6]" />
                          <span className="text-[0.66rem] font-bold uppercase tracking-[0.14em]">
                            {badge.tooltip}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Daily download area chart — shared by listing and author detail pages
// ---------------------------------------------------------------------------

export function DailyDownloadChart({
  data,
  color,
  height = 180,
}: {
  data: DailyDataPoint[];
  color: string;
  height?: number;
}) {
  const isClientReady = useClientReady();
  if (data.length === 0) return null;
  if (!isClientReady) {
    return <div style={{ height, width: '100%' }} />;
  }

  // Format date label: "2026-03-11" → "Mar 11"
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

  const chartData = data.map((p) => ({ ...p, label: fmtDate(p.date) }));
  const maxVal = Math.max(...data.map((p) => p.downloads), 1);
  // Pad top axis a little
  const yMax = Math.ceil(maxVal * 1.15);
  const gradientId = `ddc-grad-${color.replace(/[^a-zA-Z0-9_-]/g, '') || 'default'}`;

  return (
    <SafeChartContainer height={height}>
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 10, bottom: 8, left: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
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
            domain={[0, yMax]}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatCount(v)}
            width={32}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg bg-overlay/75 p-2.5 text-xs text-overlay-fg ring ring-current/10 backdrop-blur-lg">
                  <span className="font-semibold">{label as string}</span>
                  <div className="mt-1">
                    {(payload[0]!.value as number).toLocaleString()} downloads
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
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </SafeChartContainer>
  );
}
