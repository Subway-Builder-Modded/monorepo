'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { SortableNumberHeader } from '@/components/shared/sortable-number-header';

import {
  REGISTRY_LINK_HOVER_CLS,
  RegistryFilterControls,
  SafeChartContainer,
  formatCount,
  getListingColor,
  MAP_COLOR,
  MOD_COLOR,
  type PeriodKey,
  RegistryTooltip,
  RankBadge,
  SectionHeader,
  TABLE_CELL_CLS,
  TABLE_CELL_NUMERIC_CLS,
  TABLE_HEADER_CLS,
  TABLE_HEADER_RIGHT_CLS,
  TABLE_ROW_CLS,
  truncateName,
  useClientReady,
  registryLinkStyle,
} from '@/features/registry/components/registry-shared';
import { AuthorName } from '@/components/shared/author-name';
import type { ContributorTier } from '@/types/registry';
import type {
  ListingType,
  RegistryAnalyticsData,
  RegistryListingRow,
  RegistryTrendingRow,
} from '@/types/registry-analytics';
import { usePersistedState } from '@/lib/use-persisted-state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PeriodData =
  | { kind: 'alltime'; rows: RegistryListingRow[] }
  | { kind: 'trending'; rows: RegistryTrendingRow[] };

type ChartEntry = {
  name: string;
  fullName: string;
  downloads: number;
  type: ListingType;
  author: string;
  author_alias?: string;
  contributor_tier?: ContributorTier | null;
  id: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TOP_N = 10;

function rowsToChart(
  rows: Array<
    | RegistryListingRow
    | RegistryTrendingRow
    | (RegistryListingRow & { day_change?: number })
  >,
  metricKey: 'total_downloads' | 'day_change' | 'primary',
): ChartEntry[] {
  return rows.slice(0, TOP_N).map((r) => ({
    name: truncateName(r.name, 20),
    fullName: r.name,
    downloads:
      metricKey === 'day_change'
        ? 'day_change' in r
          ? Number(r.day_change ?? 0)
          : 0
        : 'download_change' in r
          ? r.download_change
          : r.total_downloads,
    type: r.listing_type,
    author: r.author,
    author_alias: r.author_alias,
    contributor_tier: r.contributor_tier,
    id: r.id,
  }));
}

// ---------------------------------------------------------------------------
// Listing search results — shows per-type rank
// ---------------------------------------------------------------------------

function ListingSearchResults({
  results,
  data,
}: {
  results: RegistryListingRow[];
  data: RegistryAnalyticsData;
}) {
  const mapResults = results.filter((row) => row.listing_type === 'map');
  const modResults = results.filter((row) => row.listing_type === 'mod');

  if (results.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 py-10 text-center text-sm text-muted-foreground">
        No listings match your search.
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <SearchGroup title="Mods" rows={modResults} data={data} type="mod" />
      <SearchGroup title="Maps" rows={mapResults} data={data} type="map" />
    </div>
  );
}

function SearchGroup({
  title,
  rows,
  data,
  type,
}: {
  title: string;
  rows: RegistryListingRow[];
  data: RegistryAnalyticsData;
  type: ListingType;
}) {
  const accent = getListingColor(type);
  const [sort, setSort] = usePersistedState<{
    key: 'total_downloads' | 'day_change';
    direction: 'asc' | 'desc';
  }>(`registry.analytics.search.${type}.sort`, {
    key: 'total_downloads',
    direction: 'desc',
  });

  const sortedRows = useMemo(() => {
    const withTrend = rows.map((row) => ({
      ...row,
      day_change:
        data.trending1d.find((trend) => trend.id === row.id)?.download_change ??
        0,
    }));
    const ordered = [...withTrend].sort((left, right) => {
      const leftValue = left[sort.key];
      const rightValue = right[sort.key];
      if (leftValue === rightValue) return left.rank - right.rank;
      return sort.direction === 'asc'
        ? leftValue - rightValue
        : rightValue - leftValue;
    });
    return ordered;
  }, [data.trending1d, rows, sort.direction, sort.key]);

  const toggleSort = (key: 'total_downloads' | 'day_change') => {
    setSort((previous) => ({
      key,
      direction:
        previous.key === key && previous.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  if (rows.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card ring-1 ring-foreground/5">
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
        <span
          className="size-2 rounded-sm"
          style={{ backgroundColor: accent }}
        />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title} ({rows.length})
        </p>
      </div>
      <div className="overflow-x-auto">
        <div className="border-b border-border/70 p-4">
          <TypeBarChart
            data={rowsToChart(
              sortedRows,
              sort.key === 'day_change' ? 'day_change' : 'total_downloads',
            )}
            type={type}
            chartHeight={260}
          />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/35">
              <th className={TABLE_HEADER_CLS}>Name</th>
              <th className={`hidden ${TABLE_HEADER_CLS} sm:table-cell`}>
                Author
              </th>
              <th className={TABLE_HEADER_RIGHT_CLS}>
                <SortableNumberHeader
                  label="Downloads"
                  isActive={sort.key === 'total_downloads'}
                  direction={sort.direction}
                  accentColor={accent}
                  onToggle={() => toggleSort('total_downloads')}
                />
              </th>
              <th className={TABLE_HEADER_RIGHT_CLS}>
                <SortableNumberHeader
                  label="24h"
                  isActive={sort.key === 'day_change'}
                  direction={sort.direction}
                  accentColor={accent}
                  onToggle={() => toggleSort('day_change')}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              return (
                <tr key={row.id} className={TABLE_ROW_CLS}>
                  <td className={TABLE_CELL_CLS}>
                    <Link
                      href={`/registry/${row.listing_type === 'map' ? 'maps' : 'mods'}/${row.id}`}
                      className={`font-medium ${REGISTRY_LINK_HOVER_CLS}`}
                      style={registryLinkStyle(accent)}
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td
                    className={`hidden ${TABLE_CELL_CLS} text-muted-foreground sm:table-cell`}
                  >
                    <AuthorName
                      author={row}
                      href={`/registry/authors/${encodeURIComponent(row.author)}`}
                      linkClassName={REGISTRY_LINK_HOVER_CLS}
                      style={registryLinkStyle(accent)}
                    />
                  </td>
                  <td
                    className={`${TABLE_CELL_NUMERIC_CLS} ${sort.key === 'total_downloads' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                    style={
                      sort.key === 'total_downloads'
                        ? { color: accent }
                        : undefined
                    }
                  >
                    {row.total_downloads.toLocaleString()}
                  </td>
                  <td
                    className={`${TABLE_CELL_NUMERIC_CLS} ${sort.key === 'day_change' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                    style={
                      sort.key === 'day_change' ? { color: accent } : undefined
                    }
                  >
                    {row.day_change.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bar chart for a single type
// ---------------------------------------------------------------------------

function TypeBarChart({
  data,
  type,
  chartHeight = 396,
}: {
  data: ChartEntry[];
  type: ListingType;
  chartHeight?: number;
}) {
  const isClientReady = useClientReady();
  const color = getListingColor(type);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground"
        style={{ height: 120 }}
      >
        No data for this period
      </div>
    );
  }
  if (!isClientReady) {
    return <div style={{ height: chartHeight, width: '100%' }} />;
  }

  return (
    <SafeChartContainer height={chartHeight}>
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            horizontal={false}
            vertical
            stroke="var(--border)"
            strokeOpacity={0.6}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatCount(v)}
            tickMargin={6}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={136}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => (
              <RegistryTooltip
                active={active}
                payload={payload as unknown[]}
                label={label}
              />
            )}
            cursor={{ fill: 'var(--muted)', fillOpacity: 0.4 }}
            wrapperStyle={{ outline: 'none' }}
          />
          <Bar dataKey="downloads" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((_, i) => (
              <Cell
                key={`cell-${i}`}
                fill={color}
                fillOpacity={0.85 - i * 0.03}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </SafeChartContainer>
  );
}

// ---------------------------------------------------------------------------
// Table for a single type — per-type index rank (1-based)
// ---------------------------------------------------------------------------

function TypeTable({
  data,
  type,
  isAllTime,
}: {
  data: RegistryListingRow[] | RegistryTrendingRow[];
  type: ListingType;
  isAllTime: boolean;
}) {
  const [sort, setSort] = usePersistedState<{
    key: 'primary';
    direction: 'asc' | 'desc';
  }>(`registry.analytics.content.${type}.sort`, {
    key: 'primary',
    direction: 'desc',
  });

  const rows = useMemo(() => {
    const baseRows = data.filter((row) => row.listing_type === type);
    const ordered = [...baseRows].sort((left, right) => {
      const leftValue =
        'download_change' in left ? left.download_change : left.total_downloads;
      const rightValue =
        'download_change' in right
          ? right.download_change
          : right.total_downloads;
      if (leftValue === rightValue) return left.rank - right.rank;
      return sort.direction === 'asc'
        ? leftValue - rightValue
        : rightValue - leftValue;
    });
    return ordered.slice(0, 20);
  }, [data, sort.direction, type]);
  const color = getListingColor(type);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-lg border border-border">
      <div className="border-b border-border/70 p-4">
        <TypeBarChart data={rowsToChart(rows, 'primary')} type={type} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className={TABLE_HEADER_CLS}>#</th>
              <th className={TABLE_HEADER_CLS}>Name</th>
              <th className={`hidden ${TABLE_HEADER_CLS} sm:table-cell`}>
                Author
              </th>
              <th className={TABLE_HEADER_RIGHT_CLS}>
                <SortableNumberHeader
                  label="Downloads"
                  isActive={sort.key === 'primary'}
                  direction={sort.direction}
                  accentColor={color}
                  onToggle={() =>
                    setSort((previous) => ({
                      key: 'primary',
                      direction: previous.direction === 'desc' ? 'asc' : 'desc',
                    }))
                  }
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isTrending = !isAllTime && 'download_change' in row;
              return (
                <tr key={row.id} className={TABLE_ROW_CLS}>
                  <td className={TABLE_CELL_CLS}>
                    <RankBadge rank={index + 1} />
                  </td>
                  <td className={TABLE_CELL_CLS}>
                    <Link
                      href={`/registry/${type === 'map' ? 'maps' : 'mods'}/${row.id}`}
                      className={`font-medium ${REGISTRY_LINK_HOVER_CLS}`}
                      style={registryLinkStyle(color)}
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td
                    className={`hidden ${TABLE_CELL_CLS} text-muted-foreground sm:table-cell`}
                  >
                    <AuthorName
                      author={row}
                      href={`/registry/authors/${encodeURIComponent(row.author)}`}
                      linkClassName={REGISTRY_LINK_HOVER_CLS}
                      style={registryLinkStyle(color)}
                    />
                  </td>
                  <td
                    className={`${TABLE_CELL_NUMERIC_CLS} ${sort.key === 'primary' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                    style={sort.key === 'primary' ? { color } : undefined}
                  >
                    {isTrending
                      ? (
                          row as RegistryTrendingRow
                        ).download_change.toLocaleString()
                      : (
                          row as RegistryListingRow
                        ).total_downloads.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Split panel — mods + maps side by side
// ---------------------------------------------------------------------------

function SplitPanel({
  periodData,
  isAllTime,
}: {
  periodData: PeriodData;
  isAllTime: boolean;
}) {
  const allRows = periodData.rows;

  return (
    <div className="grid gap-8 xl:grid-cols-2">
      {/* Mods */}
      <div id="mod-rankings" className="scroll-mt-24">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ backgroundColor: MOD_COLOR, opacity: 0.88 }}
          />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Mods
          </h3>
        </div>
        <TypeTable data={allRows} type="mod" isAllTime={isAllTime} />
      </div>

      {/* Maps */}
      <div id="map-rankings" className="scroll-mt-24">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ backgroundColor: MAP_COLOR, opacity: 0.88 }}
          />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Maps
          </h3>
        </div>
        <TypeTable data={allRows} type="map" isAllTime={isAllTime} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

export function RegistryTrendingSection({
  data,
}: {
  data: RegistryAnalyticsData;
}) {
  const [period, setPeriod] = usePersistedState<PeriodKey>(
    'registry.analytics.content.period',
    'all',
  );
  const [query, setQuery] = useState('');

  const isSearching = query.trim().length > 0;

  const searchResults = isSearching
    ? data.allTime
        .filter(
          (r) =>
            r.name.toLowerCase().includes(query.toLowerCase()) ||
            r.author.toLowerCase().includes(query.toLowerCase()) ||
            (r.author_alias ?? '')
              .toLowerCase()
              .includes(query.toLowerCase()) ||
            r.id.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 30)
    : [];

  const periodData: PeriodData =
    period === 'all'
      ? { kind: 'alltime', rows: data.allTime }
      : period === '1d'
        ? { kind: 'trending', rows: data.trending1d }
        : period === '3d'
          ? { kind: 'trending', rows: data.trending3d }
          : { kind: 'trending', rows: data.trending7d };

  return (
    <section className="mb-12">
      <SectionHeader icon={Trophy} title="Rankings" />

      <RegistryFilterControls
        period={!isSearching ? period : undefined}
        onPeriodChange={setPeriod}
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Search listings by name, author, or ID..."
      />

      {isSearching ? (
        <ListingSearchResults results={searchResults} data={data} />
      ) : (
        <SplitPanel periodData={periodData} isAllTime={period === 'all'} />
      )}
    </section>
  );
}
