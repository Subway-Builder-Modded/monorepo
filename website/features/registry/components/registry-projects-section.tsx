'use client';

import { useState } from 'react';
import { FolderGit2 } from 'lucide-react';

import {
  RegistryFilterControls,
  type PeriodKey,
  RankBadge,
  SectionHeader,
  TABLE_CELL_CLS,
  TABLE_CELL_NUMERIC_CLS,
  TABLE_HEADER_CLS,
  TABLE_HEADER_RIGHT_CLS,
  TABLE_ROW_CLS,
} from '@/features/registry/components/registry-shared';
import type { RegistryAnalyticsData } from '@/types/registry-analytics';

const MAX_ROWS = 20;

type ProjectDisplayRow = {
  rank: number;
  project_key: string;
  project_name: string;
  listing_count: number;
  primary_value: number;
  is_trending: boolean;
};

function buildRows(
  period: PeriodKey,
  data: RegistryAnalyticsData,
): ProjectDisplayRow[] {
  if (period === 'all') {
    return data.projects.map((p) => ({
      rank: p.rank,
      project_key: p.project_key,
      project_name: p.project_name,
      listing_count: p.listing_count,
      primary_value: p.total_downloads,
      is_trending: false,
    }));
  }
  const src =
    period === '1d'
      ? data.projectsTrending1d
      : period === '3d'
        ? data.projectsTrending3d
        : data.projectsTrending7d;

  return src.map((p) => ({
    rank: p.rank,
    project_key: p.project_key,
    project_name: p.project_name,
    listing_count: p.listing_count,
    primary_value: p.download_change,
    is_trending: true,
  }));
}

// Small inline bar to visualize relative size
function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(2, (value / max) * 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary/60"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function RegistryProjectsSection({
  data,
}: {
  data: RegistryAnalyticsData;
}) {
  const [period, setPeriod] = useState<PeriodKey>('all');
  const [query, setQuery] = useState('');

  const allRows = buildRows(period, data);
  const filtered = query.trim()
    ? allRows.filter(
        (r) =>
          r.project_name.toLowerCase().includes(query.toLowerCase()) ||
          r.project_key.toLowerCase().includes(query.toLowerCase()),
      )
    : allRows;
  const rows = filtered.slice(0, MAX_ROWS);
  const maxValue = rows[0]?.primary_value ?? 1;

  return (
    <section className="mb-4">
      <SectionHeader icon={FolderGit2} title="Top Projects" />

      <RegistryFilterControls
        period={period}
        onPeriodChange={setPeriod}
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Search repositories..."
      />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className={TABLE_HEADER_CLS}>Repository</th>
              <th className={`hidden ${TABLE_HEADER_RIGHT_CLS} sm:table-cell`}>
                Listings
              </th>
              <th className={TABLE_HEADER_RIGHT_CLS}>Downloads</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  No repositories match your search.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.project_key} className={TABLE_ROW_CLS}>
                  <td className={TABLE_CELL_CLS}>
                    <div>
                      <div className="inline-flex items-center gap-2">
                        <RankBadge rank={row.rank} />
                        <a
                          href={`https://github.com/${row.project_key}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                        >
                          {row.project_name}
                        </a>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {row.project_key}
                      </p>
                      <div className="mt-1.5 w-full max-w-48">
                        <MiniBar value={row.primary_value} max={maxValue} />
                      </div>
                    </div>
                  </td>
                  <td
                    className={`hidden ${TABLE_CELL_NUMERIC_CLS} text-muted-foreground sm:table-cell`}
                  >
                    {row.listing_count}
                  </td>
                  <td
                    className={`${TABLE_CELL_NUMERIC_CLS} font-semibold text-primary`}
                  >
                    {row.is_trending ? '+' : ''}
                    {row.primary_value.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
