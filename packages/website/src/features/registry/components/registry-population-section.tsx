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
import { Globe } from 'lucide-react';
import { SortableNumberHeader } from '@/components/shared/sortable-number-header';
import { getCountryFlagIcon } from '@/lib/railyard/flags';
import { usePersistedState } from '@/lib/use-persisted-state';
import { AuthorName } from '@/components/shared/author-name';

import {
  MAP_COLOR,
  REGISTRY_LINK_HOVER_CLS,
  RankBadge,
  SafeChartContainer,
  SearchField,
  SectionHeader,
  TABLE_CELL_CLS,
  TABLE_CELL_NUMERIC_CLS,
  TABLE_HEADER_CLS,
  TABLE_HEADER_RIGHT_CLS,
  TABLE_ROW_CLS,
  formatCount,
  truncateName,
  useClientReady,
  registryLinkStyle,
} from '@/features/registry/components/registry-shared';
import type { RegistryAnalyticsData } from '@/types/registry-analytics';

type PopulationRow = RegistryAnalyticsData['mapPopulations'][number];

function PopulationChart({
  rows,
  metricKey,
  metricLabel,
}: {
  rows: PopulationRow[];
  metricKey: PopulationSortKey;
  metricLabel: string;
}) {
  const isClientReady = useClientReady();
  const chartData = rows.slice(0, 10).map((row) => ({
    id: row.id,
    name: truncateName(row.name, 22),
    fullName: row.name,
    value: row[metricKey],
    cityCode: row.city_code,
  }));

  if (!isClientReady) return <div style={{ height: 320, width: '100%' }} />;

  return (
    <SafeChartContainer height={320}>
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 22, bottom: 4, left: 0 }}
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
            width={144}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const datum = payload[0]?.payload as
                | { fullName?: string; cityCode?: string }
                | undefined;
              return (
                <div className="rounded-lg bg-overlay/75 p-2.5 text-xs text-overlay-fg ring ring-current/10 backdrop-blur-lg">
                  <span className="font-semibold">
                    {datum?.fullName ?? (label as string)}
                  </span>
                  <div className="mt-1">
                    {(payload[0]!.value as number).toLocaleString()}{' '}
                    {metricLabel.toLowerCase()}
                  </div>
                  {datum?.cityCode ? (
                    <div className="mt-1 text-muted-fg">{datum.cityCode}</div>
                  ) : null}
                </div>
              );
            }}
            cursor={{ fill: 'var(--muted)', fillOpacity: 0.4 }}
            wrapperStyle={{ outline: 'none' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={MAP_COLOR}
                fillOpacity={0.9 - index * 0.055}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </SafeChartContainer>
  );
}

type PopulationSortKey = 'population' | 'points_count' | 'population_count';

type PopulationSortState = {
  key: PopulationSortKey;
  direction: 'asc' | 'desc';
};

function PopulationSearchResultsTable({
  rows,
  sortKey,
  sortDirection,
  onToggleSort,
}: {
  rows: PopulationRow[];
  sortKey: PopulationSortKey;
  sortDirection: 'asc' | 'desc';
  onToggleSort: (key: PopulationSortKey) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className={TABLE_HEADER_CLS}>Map</th>
            <th className={`hidden ${TABLE_HEADER_CLS} md:table-cell`}>
              Author
            </th>
            <th className={`hidden ${TABLE_HEADER_CLS} sm:table-cell`}>
              Country
            </th>
            <th className={`hidden ${TABLE_HEADER_CLS} lg:table-cell`}>City</th>
            <th className={TABLE_HEADER_RIGHT_CLS}>
              <SortableNumberHeader
                label="Population"
                isActive={sortKey === 'population'}
                direction={sortDirection}
                accentColor={MAP_COLOR}
                onToggle={() => onToggleSort('population')}
              />
            </th>
            <th className={`hidden ${TABLE_HEADER_RIGHT_CLS} lg:table-cell`}>
              <SortableNumberHeader
                label="Count"
                isActive={sortKey === 'population_count'}
                direction={sortDirection}
                accentColor={MAP_COLOR}
                onToggle={() => onToggleSort('population_count')}
              />
            </th>
            <th className={`hidden ${TABLE_HEADER_RIGHT_CLS} lg:table-cell`}>
              <SortableNumberHeader
                label="Demand Points"
                isActive={sortKey === 'points_count'}
                direction={sortDirection}
                accentColor={MAP_COLOR}
                onToggle={() => onToggleSort('points_count')}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-3 py-6 text-center text-sm text-muted-foreground"
              >
                No maps match your search.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const countryCode = /^[A-Za-z]{2}$/.test(row.country)
                ? row.country.toUpperCase()
                : undefined;
              const CountryFlag = getCountryFlagIcon(countryCode);
              return (
                <tr key={row.id} className={TABLE_ROW_CLS}>
                  <td className={TABLE_CELL_CLS}>
                    <Link
                      href={`/registry/maps/${row.id}`}
                      className={`font-medium ${REGISTRY_LINK_HOVER_CLS}`}
                      style={registryLinkStyle(MAP_COLOR)}
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className={`hidden ${TABLE_CELL_CLS} md:table-cell`}>
                    <AuthorName
                      author={row}
                      href={`/registry/authors/${encodeURIComponent(row.author)}`}
                      linkClassName={REGISTRY_LINK_HOVER_CLS}
                      style={registryLinkStyle(MAP_COLOR)}
                    />
                  </td>
                  <td
                    className={`hidden ${TABLE_CELL_CLS} text-muted-foreground sm:table-cell`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {CountryFlag ? (
                        <CountryFlag className="h-3.5 w-auto rounded-[2px]" />
                      ) : null}
                      {countryCode ?? row.country}
                    </span>
                  </td>
                  <td
                    className={`hidden ${TABLE_CELL_CLS} text-muted-foreground lg:table-cell`}
                  >
                    {row.city_code}
                  </td>
                  <td
                    className={`${TABLE_CELL_NUMERIC_CLS} ${sortKey === 'population' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                    style={
                      sortKey === 'population'
                        ? { color: MAP_COLOR }
                        : undefined
                    }
                  >
                    {row.population.toLocaleString()}
                  </td>
                  <td
                    className={`hidden ${TABLE_CELL_NUMERIC_CLS} lg:table-cell ${sortKey === 'population_count' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                    style={
                      sortKey === 'population_count'
                        ? { color: MAP_COLOR }
                        : undefined
                    }
                  >
                    {row.population_count.toLocaleString()}
                  </td>
                  <td
                    className={`hidden ${TABLE_CELL_NUMERIC_CLS} lg:table-cell ${sortKey === 'points_count' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                    style={
                      sortKey === 'points_count'
                        ? { color: MAP_COLOR }
                        : undefined
                    }
                  >
                    {row.points_count.toLocaleString()}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function PopulationTable({ rows }: { rows: PopulationRow[] }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = usePersistedState<PopulationSortState>(
    'registry.analytics.population.sort',
    { key: 'population', direction: 'desc' },
  );
  const filteredRows = query.trim()
    ? rows.filter((row) =>
        [
          row.name,
          row.id,
          row.author,
          row.author_alias ?? '',
          row.country,
          row.city_code,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : rows;

  const sortedRows = useMemo(() => {
    const ordered = [...filteredRows].sort((left, right) => {
      const leftValue = left[sort.key];
      const rightValue = right[sort.key];
      if (leftValue === rightValue) return left.rank - right.rank;
      return sort.direction === 'asc'
        ? leftValue - rightValue
        : rightValue - leftValue;
    });
    return ordered;
  }, [filteredRows, sort.direction, sort.key]);
  const isSearching = query.trim().length > 0;
  const activeMetricLabel =
    sort.key === 'population_count'
      ? 'Count'
      : sort.key === 'points_count'
        ? 'Demand Points'
        : 'Population';

  return (
    <div>
      <div className="mb-6 rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
        {isSearching ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Search Results by {activeMetricLabel}
          </p>
        ) : (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Top 10 Maps by {activeMetricLabel}
          </p>
        )}
        <PopulationChart
          rows={sortedRows}
          metricKey={sort.key}
          metricLabel={activeMetricLabel}
        />
      </div>

      <SearchField
        placeholder="Search maps by title, ID, author, country, or city..."
        value={query}
        onChange={setQuery}
        className="mb-3"
      />

      {isSearching ? (
        <PopulationSearchResultsTable
          rows={sortedRows}
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
                <th className={TABLE_HEADER_CLS}>Map</th>
                <th className={`hidden ${TABLE_HEADER_CLS} md:table-cell`}>
                  Author
                </th>
                <th className={`hidden ${TABLE_HEADER_CLS} sm:table-cell`}>
                  Country
                </th>
                <th className={`hidden ${TABLE_HEADER_CLS} lg:table-cell`}>
                  City
                </th>
                <th className={TABLE_HEADER_RIGHT_CLS}>
                  <SortableNumberHeader
                    label="Population"
                    isActive={sort.key === 'population'}
                    direction={sort.direction}
                    accentColor={MAP_COLOR}
                    onToggle={() =>
                      setSort((previous) => ({
                        key: 'population',
                        direction:
                          previous.key === 'population' &&
                          previous.direction === 'desc'
                            ? 'asc'
                            : 'desc',
                      }))
                    }
                  />
                </th>
                <th
                  className={`hidden ${TABLE_HEADER_RIGHT_CLS} lg:table-cell`}
                >
                  <SortableNumberHeader
                    label="Count"
                    isActive={sort.key === 'population_count'}
                    direction={sort.direction}
                    accentColor={MAP_COLOR}
                    onToggle={() =>
                      setSort((previous) => ({
                        key: 'population_count',
                        direction:
                          previous.key === 'population_count' &&
                          previous.direction === 'desc'
                            ? 'asc'
                            : 'desc',
                      }))
                    }
                  />
                </th>
                <th
                  className={`hidden ${TABLE_HEADER_RIGHT_CLS} lg:table-cell`}
                >
                  <SortableNumberHeader
                    label="Demand Points"
                    isActive={sort.key === 'points_count'}
                    direction={sort.direction}
                    accentColor={MAP_COLOR}
                    onToggle={() =>
                      setSort((previous) => ({
                        key: 'points_count',
                        direction:
                          previous.key === 'points_count' &&
                          previous.direction === 'desc'
                            ? 'asc'
                            : 'desc',
                      }))
                    }
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, index) => {
                const countryCode = /^[A-Za-z]{2}$/.test(row.country)
                  ? row.country.toUpperCase()
                  : undefined;
                const CountryFlag = getCountryFlagIcon(countryCode);
                return (
                  <tr key={row.id} className={TABLE_ROW_CLS}>
                    <td className={TABLE_CELL_CLS}>
                      <RankBadge rank={index + 1} />
                    </td>
                    <td className={TABLE_CELL_CLS}>
                      <Link
                        href={`/registry/maps/${row.id}`}
                        className={`font-medium ${REGISTRY_LINK_HOVER_CLS}`}
                        style={registryLinkStyle(MAP_COLOR)}
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className={`hidden ${TABLE_CELL_CLS} md:table-cell`}>
                      <AuthorName
                        author={row}
                        href={`/registry/authors/${encodeURIComponent(row.author)}`}
                        linkClassName={REGISTRY_LINK_HOVER_CLS}
                        style={registryLinkStyle(MAP_COLOR)}
                      />
                    </td>
                    <td
                      className={`hidden ${TABLE_CELL_CLS} text-muted-foreground sm:table-cell`}
                    >
                      <span className="inline-flex items-center gap-2">
                        {CountryFlag ? (
                          <CountryFlag className="h-3.5 w-auto rounded-[2px]" />
                        ) : null}
                        {countryCode ?? row.country}
                      </span>
                    </td>
                    <td
                      className={`hidden ${TABLE_CELL_CLS} text-muted-foreground lg:table-cell`}
                    >
                      {row.city_code}
                    </td>
                    <td
                      className={`${TABLE_CELL_NUMERIC_CLS} ${sort.key === 'population' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                      style={
                        sort.key === 'population'
                          ? { color: MAP_COLOR }
                          : undefined
                      }
                    >
                      {row.population.toLocaleString()}
                    </td>
                    <td
                      className={`hidden ${TABLE_CELL_NUMERIC_CLS} lg:table-cell ${sort.key === 'population_count' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                      style={
                        sort.key === 'population_count'
                          ? { color: MAP_COLOR }
                          : undefined
                      }
                    >
                      {row.population_count.toLocaleString()}
                    </td>
                    <td
                      className={`hidden ${TABLE_CELL_NUMERIC_CLS} lg:table-cell ${sort.key === 'points_count' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                      style={
                        sort.key === 'points_count'
                          ? { color: MAP_COLOR }
                          : undefined
                      }
                    >
                      {row.points_count.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function RegistryPopulationSection({
  data,
}: {
  data: RegistryAnalyticsData;
}) {
  const rows = data.mapPopulations;
  return (
    <section id="population-rankings" className="scroll-mt-24 mb-12">
      <SectionHeader icon={Globe} title="Population Rank" accent={MAP_COLOR} />

      <PopulationTable rows={rows} />
    </section>
  );
}
