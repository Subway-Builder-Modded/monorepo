'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Search } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PROJECT_COLOR_SCHEMES } from '@/config/theme/colors';
import { cn } from '@/lib/utils';
import type { WebsiteAnalyticsPeriod } from '@/types/website-analytics';

export const WEBSITE_PAGE_HEADER_SCHEME = {
  accent: PROJECT_COLOR_SCHEMES.website.accentColor,
};

export const WEBSITE_ACCENT_COLOR =
  PROJECT_COLOR_SCHEMES.website.accentColor.dark;

export const WEBSITE_TABLE_HEADER_CLS =
  'px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground';
export const WEBSITE_TABLE_CELL_CLS = 'px-3 py-2.5 text-left';
export const WEBSITE_TABLE_NUMERIC_CLS = 'px-3 py-2.5 text-left tabular-nums';
export const WEBSITE_TABLE_ROW_CLS =
  'border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30';

export function WebsiteSectionHeader({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </h2>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 10_000) return `${Math.round(value / 1_000)}k`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString();
}

export function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '—';
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}

export function useClientReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  return isReady;
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

const PERIOD_OPTIONS: { value: WebsiteAnalyticsPeriod; label: string }[] = [
  { value: '1d', label: 'Last Day' },
  { value: '7d', label: 'Last Week' },
  { value: '30d', label: 'Last Month' },
  { value: 'all', label: 'Last Year' },
];

export function WebsitePeriodToggle({
  value,
  onChange,
  includeAll = true,
}: {
  value: WebsiteAnalyticsPeriod;
  onChange: (next: WebsiteAnalyticsPeriod) => void;
  includeAll?: boolean;
}) {
  const options = includeAll
    ? PERIOD_OPTIONS
    : PERIOD_OPTIONS.filter((option) => option.value !== 'all');

  return (
    <ToggleGroup
      type="single"
      value={value}
      variant="default"
      size="sm"
      spacing={1}
      onValueChange={(next) => {
        if (
          next === '1d' ||
          next === '7d' ||
          next === '30d' ||
          next === 'all'
        ) {
          onChange(next);
        }
      }}
      className="h-10 rounded-xl border border-border/70 bg-background/90 p-0.5 shadow-sm backdrop-blur-md"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="h-9 rounded-lg px-3.5 text-sm font-semibold text-muted-foreground hover:bg-accent/45 hover:text-primary data-[state=on]:bg-accent/45 data-[state=on]:text-primary"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function WebsiteSearchField({
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
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-border/80 bg-muted/20 pl-9 pr-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/60 focus:border-primary/45 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/70 p-8 text-center ring-1 ring-foreground/5">
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function WebsiteRankBadge({ rank }: { rank: number }) {
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
