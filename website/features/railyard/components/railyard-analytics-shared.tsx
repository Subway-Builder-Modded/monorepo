'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@subway-builder-modded/shared-ui';
import { PROJECT_COLOR_SCHEMES } from '@/config/theme/colors';
import { cn } from '@subway-builder-modded/shared-ui';

export const RAILYARD_ANALYTICS_PAGE_HEADER_SCHEME = {
  accent: PROJECT_COLOR_SCHEMES.railyard.accentColor,
};

export const RAILYARD_ACCENT_COLOR =
  PROJECT_COLOR_SCHEMES.railyard.accentColor.dark;

export const RAILYARD_PREVIOUS_COLOR = '#2c6e58';

export const RAILYARD_OS_COLORS = {
  windows: '#3b82f6',
  macos: '#eab308',
  linux: '#ef4444',
} as const;

export function RailyardSectionHeader({
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

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0.0%';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}

export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
}

export function compareSemver(left: string, right: string): number {
  const leftParts = left.split('.').map((part) => Number(part));
  const rightParts = right.split('.').map((part) => Number(part));
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const l = leftParts[index] ?? 0;
    const r = rightParts[index] ?? 0;
    if (l !== r) return l - r;
  }

  return left.localeCompare(right);
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

export function RailyardRankBadge({ rank }: { rank: number }) {
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

type TimelinePeriodValue = 'all' | '1' | '3' | '7' | '14';

const TIMELINE_PERIOD_OPTIONS: { value: TimelinePeriodValue; label: string }[] =
  [
    { value: 'all', label: 'All Time' },
    { value: '1', label: 'Last 24 Hours' },
    { value: '3', label: 'Last 3 Days' },
    { value: '7', label: 'Last Week' },
    { value: '14', label: 'Last 2 Weeks' },
  ];

export function RailyardTimelinePeriodToggle({
  value,
  onChange,
}: {
  value: TimelinePeriodValue;
  onChange: (value: TimelinePeriodValue) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
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
          onChange(next);
        }
      }}
      className="h-10 rounded-xl border border-border/70 bg-background/90 p-0.5 shadow-sm backdrop-blur-md"
    >
      {TIMELINE_PERIOD_OPTIONS.map((option) => (
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
