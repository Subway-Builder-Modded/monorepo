'use client';

import { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import {
  SortableNumberHeader,
  type SortDirection,
} from '@/components/shared/sortable-number-header';
import { usePersistedState } from '@/lib/use-persisted-state';
import type {
  WebsiteAnalyticsData,
  WebsiteAnalyticsPeriod,
  WebsitePageRow,
} from '@/types/website-analytics';
import {
  EmptyState,
  WEBSITE_ACCENT_COLOR,
  WEBSITE_TABLE_CELL_CLS,
  WEBSITE_TABLE_HEADER_CLS,
  WEBSITE_TABLE_NUMERIC_CLS,
  WEBSITE_TABLE_ROW_CLS,
  WebsitePeriodToggle,
  WebsiteRankBadge,
  WebsiteSearchField,
  WebsiteSectionHeader,
} from './website-shared';

type PageSortState = {
  key: 'visits';
  direction: SortDirection;
};

function PageTable({
  rows,
  period,
  title,
  sort,
  onToggleVisitsSort,
}: {
  rows: Array<WebsitePageRow & { rank: number }>;
  period: WebsiteAnalyticsPeriod;
  title: string;
  sort: PageSortState;
  onToggleVisitsSort: () => void;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={`No ${title.toLowerCase()} data`}
        description="This dataset will appear once snapshot rows are available."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card ring-1 ring-foreground/5">
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col className="w-14" />
          <col />
          <col className="w-28" />
        </colgroup>
        <thead>
          <tr className="border-b border-border bg-muted/35">
            <th className={WEBSITE_TABLE_HEADER_CLS}>#</th>
            <th className={WEBSITE_TABLE_HEADER_CLS}>Page</th>
            <th className={WEBSITE_TABLE_HEADER_CLS}>
              <SortableNumberHeader
                label="Visits"
                isActive={sort.key === 'visits'}
                direction={sort.direction}
                accentColor={WEBSITE_ACCENT_COLOR}
                onToggle={onToggleVisitsSort}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.path} className={WEBSITE_TABLE_ROW_CLS}>
              <td className={WEBSITE_TABLE_CELL_CLS}>
                <WebsiteRankBadge rank={row.rank} />
              </td>
              <td className={WEBSITE_TABLE_CELL_CLS}>
                <span className="block truncate font-medium text-foreground">
                  {row.path}
                </span>
              </td>
              <td
                className={`${WEBSITE_TABLE_NUMERIC_CLS} ${sort.key === 'visits' ? 'font-black' : 'font-medium text-muted-foreground'}`}
                style={
                  sort.key === 'visits'
                    ? { color: WEBSITE_ACCENT_COLOR }
                    : undefined
                }
              >
                {row.pageviews[period].toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function WebsitePagesSection({ data }: { data: WebsiteAnalyticsData }) {
  const [period, setPeriod] = usePersistedState<WebsiteAnalyticsPeriod>(
    'website.analytics.pages.period',
    '7d',
  );
  const [query, setQuery] = useState('');
  const [sort, setSort] = usePersistedState<PageSortState>(
    'website.analytics.pages.sort',
    { key: 'visits', direction: 'desc' },
  );

  const filteredPages = useMemo<
    Array<WebsitePageRow & { rank: number }>
  >(() => {
    const sortByVisits = (a: WebsitePageRow, b: WebsitePageRow) => {
      const leftValue = a.pageviews[period];
      const rightValue = b.pageviews[period];
      if (leftValue === rightValue) return a.path.localeCompare(b.path);
      return sort.direction === 'asc'
        ? leftValue - rightValue
        : rightValue - leftValue;
    };

    const globallyRankedRows = [...data.pages]
      .sort(sortByVisits)
      .map((row, index) => ({ ...row, rank: index + 1 }));

    const trimmed = query.trim().toLowerCase();
    const matchingRows =
      trimmed.length === 0
        ? globallyRankedRows
        : globallyRankedRows.filter((row) =>
            row.path.toLowerCase().includes(trimmed),
          );

    return trimmed.length === 0 ? matchingRows.slice(0, 20) : matchingRows;
  }, [data.pages, period, query, sort.direction]);

  const handleToggleVisitsSort = () => {
    setSort((previous) => ({
      key: 'visits',
      direction: previous.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  return (
    <section className="mb-12">
      <WebsiteSectionHeader icon={FileText} title="Pages" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <WebsitePeriodToggle value={period} onChange={setPeriod} includeAll />
        <WebsiteSearchField
          placeholder="Search paths..."
          value={query}
          onChange={setQuery}
          className="min-w-64 flex-1 sm:max-w-md"
        />
      </div>

      <PageTable
        rows={filteredPages}
        period={period}
        title="Pages"
        sort={sort}
        onToggleVisitsSort={handleToggleVisitsSort}
      />
    </section>
  );
}
