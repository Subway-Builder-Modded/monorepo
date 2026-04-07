'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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
import { Users } from 'lucide-react';
import { SortableNumberHeader } from '@/components/shared/sortable-number-header';
import { usePersistedState } from '@/lib/use-persisted-state';
import { AuthorName } from '@/components/shared/author-name';

import {
  REGISTRY_LINK_HOVER_CLS,
  SearchField,
  formatCount,
  getAuthorDisplayName,
  MAP_COLOR,
  MOD_COLOR,
  registryLinkStyle,
  RankBadge,
  SafeChartContainer,
  SectionHeader,
  TABLE_CELL_CLS,
  TABLE_CELL_NUMERIC_CLS,
  TABLE_HEADER_CLS,
  TABLE_HEADER_RIGHT_CLS,
  TABLE_ROW_CLS,
  truncateName,
  useClientReady,
} from '@/features/registry/components/registry-shared';
import type {
  RegistryAnalyticsData,
  RegistryAuthorRow,
} from '@/types/registry-analytics';

// ---------------------------------------------------------------------------
// Sort-aware bar chart (top 10 by active metric)
// ---------------------------------------------------------------------------

function AuthorsMetricChart({
  rows,
  metricKey,
  metricLabel,
  accentColor,
}: {
  rows: RegistryAuthorRow[];
  metricKey: 'total_downloads' | 'map_count' | 'mod_count' | 'asset_count';
  metricLabel: string;
  accentColor: string;
}) {
  const isClientReady = useClientReady();
  const chartData = rows.slice(0, 10).map((a) => ({
    name: truncateName(getAuthorDisplayName(a), 18),
    fullName: getAuthorDisplayName(a),
    value:
      metricKey === 'map_count'
        ? a.map_count
        : metricKey === 'mod_count'
          ? a.mod_count
          : metricKey === 'asset_count'
            ? a.asset_count
            : a.total_downloads,
  }));

  if (!isClientReady) {
    return <div style={{ height: 320, width: '100%' }} />;
  }

  return (
    <SafeChartContainer height={320}>
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 4, left: 0 }}
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
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            width={132}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg bg-overlay/75 p-2.5 text-xs text-overlay-fg ring ring-current/10 backdrop-blur-lg">
                  <span className="font-semibold">
                    {(payload[0]?.payload as { fullName?: string } | undefined)
                      ?.fullName ?? (label as string)}
                  </span>
                  <div className="mt-1">
                    {(payload[0]!.value as number).toLocaleString()}{' '}
                    {metricLabel.toLowerCase()}
                  </div>
                </div>
              );
            }}
            cursor={{ fill: 'var(--muted)', fillOpacity: 0.4 }}
            wrapperStyle={{ outline: 'none' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {chartData.map((_, i) => (
              <Cell
                key={`cell-${i}`}
                fill={accentColor}
                fillOpacity={0.9 - i * 0.055}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </SafeChartContainer>
  );
}

// ---------------------------------------------------------------------------
// Authors table
// ---------------------------------------------------------------------------

const MAX_AUTHORS = 20;

type AuthorSortKey =
  | 'total_downloads'
  | 'map_count'
  | 'mod_count'
  | 'asset_count';

type AuthorSortState = {
  key: AuthorSortKey;
  direction: 'asc' | 'desc';
};

function AuthorRow({
  row,
  displayRank,
  sortKey,
}: {
  row: RegistryAuthorRow;
  displayRank: number;
  sortKey: AuthorSortKey;
}) {
  return (
    <tr key={row.author} className={TABLE_ROW_CLS}>
      <td className={TABLE_CELL_CLS}>
        <RankBadge rank={displayRank} />
      </td>
      <td className={TABLE_CELL_CLS}>
        <AuthorName
          author={row}
          href={`/registry/authors/${encodeURIComponent(row.author)}`}
          linkClassName={`font-medium ${REGISTRY_LINK_HOVER_CLS}`}
          style={registryLinkStyle('var(--primary)')}
        />
      </td>
      <td
        className={`${TABLE_CELL_NUMERIC_CLS} ${sortKey === 'total_downloads' ? 'font-black' : 'font-medium text-muted-foreground'}`}
        style={
          sortKey === 'total_downloads'
            ? { color: 'var(--primary)' }
            : undefined
        }
      >
        {row.total_downloads.toLocaleString()}
      </td>
      <td
        className={`hidden ${TABLE_CELL_NUMERIC_CLS} sm:table-cell ${sortKey === 'map_count' ? 'font-black' : 'font-medium text-muted-foreground'}`}
        style={sortKey === 'map_count' ? { color: MAP_COLOR } : undefined}
      >
        {row.map_count}
      </td>
      <td
        className={`hidden ${TABLE_CELL_NUMERIC_CLS} sm:table-cell ${sortKey === 'mod_count' ? 'font-black' : 'font-medium text-muted-foreground'}`}
        style={sortKey === 'mod_count' ? { color: MOD_COLOR } : undefined}
      >
        {row.mod_count}
      </td>
      <td
        className={`hidden ${TABLE_CELL_NUMERIC_CLS} md:table-cell ${sortKey === 'asset_count' ? 'font-black' : 'font-medium text-muted-foreground'}`}
        style={
          sortKey === 'asset_count' ? { color: 'var(--primary)' } : undefined
        }
      >
        {row.asset_count}
      </td>
    </tr>
  );
}

function AuthorSearchResultsTable({
  rows,
  sortKey,
  sortDirection,
  onToggleSort,
}: {
  rows: RegistryAuthorRow[];
  sortKey: AuthorSortKey;
  sortDirection: 'asc' | 'desc';
  onToggleSort: (key: AuthorSortKey) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className={TABLE_HEADER_CLS}>Author</th>
            <th className={TABLE_HEADER_RIGHT_CLS}>
              <SortableNumberHeader
                label="Downloads"
                isActive={sortKey === 'total_downloads'}
                direction={sortDirection}
                accentColor="var(--primary)"
                onToggle={() => onToggleSort('total_downloads')}
              />
            </th>
            <th className={`hidden ${TABLE_HEADER_RIGHT_CLS} sm:table-cell`}>
              <SortableNumberHeader
                label="Maps Published"
                isActive={sortKey === 'map_count'}
                direction={sortDirection}
                accentColor={MAP_COLOR}
                onToggle={() => onToggleSort('map_count')}
              />
            </th>
            <th className={`hidden ${TABLE_HEADER_RIGHT_CLS} sm:table-cell`}>
              <SortableNumberHeader
                label="Mods Published"
                isActive={sortKey === 'mod_count'}
                direction={sortDirection}
                accentColor={MOD_COLOR}
                onToggle={() => onToggleSort('mod_count')}
              />
            </th>
            <th className={`hidden ${TABLE_HEADER_RIGHT_CLS} md:table-cell`}>
              <SortableNumberHeader
                label="Total Assets Published"
                isActive={sortKey === 'asset_count'}
                direction={sortDirection}
                accentColor="var(--primary)"
                onToggle={() => onToggleSort('asset_count')}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-3 py-6 text-center text-sm text-muted-foreground"
              >
                No authors match your search.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.author} className={TABLE_ROW_CLS}>
                <td className={TABLE_CELL_CLS}>
                  <Link
                    href={`/registry/authors/${encodeURIComponent(row.author)}`}
                    className={`font-medium ${REGISTRY_LINK_HOVER_CLS}`}
                    style={registryLinkStyle('var(--primary)')}
                  >
                    <AuthorName author={row} />
                  </Link>
                </td>
                <td
                  className={`${TABLE_CELL_NUMERIC_CLS} ${sortKey === 'total_downloads' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                  style={
                    sortKey === 'total_downloads'
                      ? { color: 'var(--primary)' }
                      : undefined
                  }
                >
                  {row.total_downloads.toLocaleString()}
                </td>
                <td
                  className={`hidden ${TABLE_CELL_NUMERIC_CLS} sm:table-cell ${sortKey === 'map_count' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                  style={
                    sortKey === 'map_count' ? { color: MAP_COLOR } : undefined
                  }
                >
                  {row.map_count}
                </td>
                <td
                  className={`hidden ${TABLE_CELL_NUMERIC_CLS} sm:table-cell ${sortKey === 'mod_count' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                  style={
                    sortKey === 'mod_count' ? { color: MOD_COLOR } : undefined
                  }
                >
                  {row.mod_count}
                </td>
                <td
                  className={`hidden ${TABLE_CELL_NUMERIC_CLS} md:table-cell ${sortKey === 'asset_count' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                  style={
                    sortKey === 'asset_count'
                      ? { color: 'var(--primary)' }
                      : undefined
                  }
                >
                  {row.asset_count}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function AuthorsTable({ authors }: { authors: RegistryAuthorRow[] }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = usePersistedState<AuthorSortState>(
    'registry.analytics.authors.sort',
    { key: 'total_downloads', direction: 'desc' },
  );

  const filtered = query.trim()
    ? authors.filter((a) =>
        [a.author, a.author_alias ?? '']
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : authors;
  const sorted = useMemo(() => {
    const ordered = [...filtered].sort((left, right) => {
      const leftValue = left[sort.key];
      const rightValue = right[sort.key];
      if (leftValue === rightValue) return left.rank - right.rank;
      return sort.direction === 'asc'
        ? leftValue - rightValue
        : rightValue - leftValue;
    });
    return ordered;
  }, [filtered, sort.direction, sort.key]);
  const isSearching = query.trim().length > 0;
  const visible = sorted.slice(0, MAX_AUTHORS);
  const activeMetricLabel =
    sort.key === 'map_count'
      ? 'Maps Published'
      : sort.key === 'mod_count'
        ? 'Mods Published'
        : sort.key === 'asset_count'
          ? 'Total Assets Published'
          : 'Downloads';
  const activeMetricColor =
    sort.key === 'map_count'
      ? MAP_COLOR
      : sort.key === 'mod_count'
        ? MOD_COLOR
        : 'var(--primary)';

  const makeSortToggle = (key: AuthorSortKey) => () => {
    setSort((previous) => ({
      key,
      direction:
        previous.key === key && previous.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  return (
    <div>
      <div className="mb-4 rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
        {isSearching ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Search Results by {activeMetricLabel}
          </p>
        ) : (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Top 10 by {activeMetricLabel}
          </p>
        )}
        <AuthorsMetricChart
          rows={isSearching ? sorted : visible}
          metricKey={sort.key}
          metricLabel={activeMetricLabel}
          accentColor={activeMetricColor}
        />
      </div>

      <SearchField
        placeholder="Search authors..."
        value={query}
        onChange={setQuery}
        className="mb-3"
      />

      {isSearching ? (
        <AuthorSearchResultsTable
          rows={sorted}
          sortKey={sort.key}
          sortDirection={sort.direction}
          onToggleSort={(key) => {
            setSort((previous) => ({
              key,
              direction:
                previous.key === key && previous.direction === 'desc'
                  ? 'asc'
                  : 'desc',
            }));
          }}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className={TABLE_HEADER_CLS}>#</th>
                <th className={TABLE_HEADER_CLS}>Author</th>
                <th className={TABLE_HEADER_RIGHT_CLS}>
                  <SortableNumberHeader
                    label="Downloads"
                    isActive={sort.key === 'total_downloads'}
                    direction={sort.direction}
                    accentColor="var(--primary)"
                    onToggle={makeSortToggle('total_downloads')}
                  />
                </th>
                <th
                  className={`hidden ${TABLE_HEADER_RIGHT_CLS} sm:table-cell`}
                >
                  <SortableNumberHeader
                    label="Maps Published"
                    isActive={sort.key === 'map_count'}
                    direction={sort.direction}
                    accentColor={MAP_COLOR}
                    onToggle={makeSortToggle('map_count')}
                  />
                </th>
                <th
                  className={`hidden ${TABLE_HEADER_RIGHT_CLS} sm:table-cell`}
                >
                  <SortableNumberHeader
                    label="Mods Published"
                    isActive={sort.key === 'mod_count'}
                    direction={sort.direction}
                    accentColor={MOD_COLOR}
                    onToggle={makeSortToggle('mod_count')}
                  />
                </th>
                <th
                  className={`hidden ${TABLE_HEADER_RIGHT_CLS} md:table-cell`}
                >
                  <SortableNumberHeader
                    label="Total Assets Published"
                    isActive={sort.key === 'asset_count'}
                    direction={sort.direction}
                    accentColor="var(--primary)"
                    onToggle={makeSortToggle('asset_count')}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-sm text-muted-foreground"
                  >
                    No authors match your search.
                  </td>
                </tr>
              ) : (
                visible.map((a, index) => (
                  <AuthorRow
                    key={a.author}
                    row={a}
                    displayRank={index + 1}
                    sortKey={sort.key}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!isSearching && sorted.length > MAX_AUTHORS && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Showing {MAX_AUTHORS} of {sorted.length} authors. Use search to find
          more.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

export function RegistryAuthorsSection({
  data,
}: {
  data: RegistryAnalyticsData;
}) {
  return (
    <section id="author-rankings" className="scroll-mt-24 mb-12">
      <SectionHeader icon={Users} title="Authors" />

      {/* Table */}
      <AuthorsTable authors={data.authors} />
    </section>
  );
}
