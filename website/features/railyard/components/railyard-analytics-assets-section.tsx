'use client';

import { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { HardDrive } from 'lucide-react';
import {
  SortableNumberHeader,
  type SortDirection,
} from '@/components/shared/sortable-number-header';
import type { RailyardAnalyticsData } from '@/types/railyard-analytics';
import {
  RAILYARD_ACCENT_COLOR,
  RAILYARD_OS_COLORS,
  RailyardRankBadge,
  RailyardSectionHeader,
  SafeChartContainer,
  useClientReady,
} from './railyard-analytics-shared';

const PIE_COLORS = ['#19D89C', '#0F8F68', '#2C6E58', '#4ECDC4', '#A8E6CF'];

type SortField = 'total' | 'share';

type AssetRow = {
  key: string;
  buildLabel: string;
  assetLabel: string;
  version: string;
  os: string;
  arch: string;
  packageType: string;
  total: number;
  share: number;
};

function sortRows(
  rows: AssetRow[],
  field: SortField,
  direction: SortDirection,
): AssetRow[] {
  return [...rows].sort((left, right) => {
    const leftValue = left[field];
    const rightValue = right[field];
    if (leftValue !== rightValue) {
      return direction === 'asc'
        ? leftValue - rightValue
        : rightValue - leftValue;
    }

    return left.assetLabel.localeCompare(right.assetLabel);
  });
}

export function RailyardAnalyticsAssetsSection({
  data,
}: {
  data: RailyardAnalyticsData;
}) {
  const isClientReady = useClientReady();
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const assetRows = useMemo(
    (): AssetRow[] =>
      data.versions
        .flatMap((row) =>
          row.assets.map((asset) => ({
            key: `${row.version}-${asset.assetName}`,
            assetLabel: asset.assetLabel,
            version: row.version,
            buildLabel: `${asset.assetLabel} (v${row.version})`,
            os: asset.os,
            arch: asset.arch,
            packageType: asset.packageType,
            total: asset.totalDownloads,
            share:
              data.summary.totalDownloads > 0
                ? (asset.totalDownloads / data.summary.totalDownloads) * 100
                : 0,
          })),
        )
        .sort((a, b) => b.total - a.total),
    [data.summary.totalDownloads, data.versions],
  );

  const sortedRows = useMemo(
    () => sortRows(assetRows, sortField, sortDirection),
    [assetRows, sortDirection, sortField],
  );

  const toggleSort = (nextField: SortField) => {
    if (nextField === sortField) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(nextField);
    setSortDirection('desc');
  };

  const osBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of assetRows) {
      map.set(row.os, (map.get(row.os) ?? 0) + row.total);
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [assetRows]);

  const osColor = (os: string) => {
    if (os === 'Windows') return RAILYARD_OS_COLORS.windows;
    if (os === 'macOS') return RAILYARD_OS_COLORS.macos;
    if (os === 'Linux') return RAILYARD_OS_COLORS.linux;
    return '#64748b';
  };

  const packageBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of assetRows) {
      map.set(row.packageType, (map.get(row.packageType) ?? 0) + row.total);
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [assetRows]);

  return (
    <section className="mb-12">
      <RailyardSectionHeader icon={HardDrive} title="Asset Analytics" />

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Downloads by Operating System
          </p>
          <SafeChartContainer height={280}>
            {isClientReady ? (
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <PieChart>
                  <Pie
                    data={osBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={56}
                    paddingAngle={2}
                  >
                    {osBreakdown.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={
                          osColor(entry.name) ??
                          PIE_COLORS[index % PIE_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0]?.payload as {
                        name: string;
                        value: number;
                      };
                      return (
                        <div className="rounded-lg bg-overlay/95 p-2.5 text-xs text-overlay-fg ring ring-current/20 backdrop-blur-lg">
                          <div className="font-semibold">{item.name}</div>
                          <div className="mt-1 flex items-center justify-between gap-3">
                            <span>Downloads</span>
                            <span className="font-semibold tabular-nums">
                              {item.value.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </SafeChartContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Downloads by Package Type
          </p>
          <SafeChartContainer height={280}>
            {isClientReady ? (
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <PieChart>
                  <Pie
                    data={packageBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={56}
                    paddingAngle={2}
                  >
                    {packageBreakdown.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={
                          PIE_COLORS[index % PIE_COLORS.length] ??
                          RAILYARD_ACCENT_COLOR
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0]?.payload as {
                        name: string;
                        value: number;
                      };
                      return (
                        <div className="rounded-lg bg-overlay/95 p-2.5 text-xs text-overlay-fg ring ring-current/20 backdrop-blur-lg">
                          <div className="font-semibold">{item.name}</div>
                          <div className="mt-1 flex items-center justify-between gap-3">
                            <span>Downloads</span>
                            <span className="font-semibold tabular-nums">
                              {item.value.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </SafeChartContainer>
        </div>
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
                  Asset Build
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Platform
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Type
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <SortableNumberHeader
                    label="Total"
                    isActive={sortField === 'total'}
                    direction={sortDirection}
                    accentColor={RAILYARD_ACCENT_COLOR}
                    onToggle={() => toggleSort('total')}
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
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, index) => (
                <tr
                  key={row.key}
                  className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30"
                >
                  <td className="px-3 py-2.5">
                    <RailyardRankBadge rank={index + 1} />
                  </td>
                  <td className="px-3 py-2.5 max-w-[26rem] truncate font-semibold text-foreground">
                    {row.buildLabel}
                  </td>
                  <td className="px-3 py-2.5">
                    {row.os} / {row.arch}
                  </td>
                  <td className="px-3 py-2.5">{row.packageType}</td>
                  <td
                    className={`px-3 py-2.5 tabular-nums ${sortField === 'total' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                    style={
                      sortField === 'total'
                        ? { color: RAILYARD_ACCENT_COLOR }
                        : undefined
                    }
                  >
                    {row.total.toLocaleString()}
                  </td>
                  <td
                    className={`px-3 py-2.5 tabular-nums ${sortField === 'share' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                    style={
                      sortField === 'share'
                        ? { color: RAILYARD_ACCENT_COLOR }
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
    </section>
  );
}
