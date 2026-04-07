'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Download,
  ExternalLink,
  Map,
  Package,
  History,
  Trophy,
} from 'lucide-react';
import {
  Stat,
  StatDescription,
  StatIndicator,
  StatLabel,
  StatValue,
} from '@/components/ui/stat';
import type {
  DailyDataPoint,
  RegistryAnalyticsData,
} from '@/types/registry-analytics';
import { getAuthorAnalytics } from '@/lib/registry-analytics-helpers';
import {
  DailyDownloadChart,
  REGISTRY_LINK_HOVER_CLS,
  getAuthorDisplayName,
  MAP_COLOR,
  MOD_COLOR,
  RankBadge,
  RegistryDetailShell,
  SectionHeader,
  TABLE_HEADER_CLS,
  TABLE_HEADER_RIGHT_CLS,
  TABLE_CELL_CLS,
  TABLE_CELL_NUMERIC_CLS,
  TABLE_ROW_CLS,
  registryLinkStyle,
} from './registry-shared';
import { AuthorName } from '@/components/shared/author-name';
import { SortableNumberHeader } from '@/components/shared/sortable-number-header';
import { usePersistedState } from '@/lib/use-persisted-state';

const STAT_HEADER_CLS =
  'text-xs font-semibold uppercase tracking-wider text-muted-foreground';

// ---------------------------------------------------------------------------
// Listings table
// ---------------------------------------------------------------------------

function ListingsTable({
  listings,
  type,
  color,
}: {
  listings: {
    id: string;
    name: string;
    rank: number;
    total_downloads: number;
  }[];
  type: 'map' | 'mod';
  color: string;
}) {
  const [sortDirection, setSortDirection] = usePersistedState<'asc' | 'desc'>(
    `registry.author.${type}.sort.direction`,
    'desc',
  );

  const sortedListings = useMemo(() => {
    const ordered = [...listings].sort((left, right) => {
      if (left.total_downloads === right.total_downloads) {
        return left.rank - right.rank;
      }
      return sortDirection === 'asc'
        ? left.total_downloads - right.total_downloads
        : right.total_downloads - left.total_downloads;
    });
    return ordered;
  }, [listings, sortDirection]);

  if (listings.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <colgroup>
          <col className="w-12" />
          <col />
          <col className="w-[34%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className={TABLE_HEADER_CLS}>#</th>
            <th className={TABLE_HEADER_CLS}>Name</th>
            <th className={TABLE_HEADER_RIGHT_CLS}>
              <SortableNumberHeader
                label="Downloads"
                isActive
                direction={sortDirection}
                accentColor={color}
                onToggle={() =>
                  setSortDirection((previous) =>
                    previous === 'desc' ? 'asc' : 'desc',
                  )
                }
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedListings.map((r, index) => (
            <tr key={r.id} className={TABLE_ROW_CLS}>
              <td className={TABLE_CELL_CLS}>
                <RankBadge rank={index + 1} />
              </td>
              <td className={TABLE_CELL_CLS}>
                <Link
                  href={`/registry/${type === 'map' ? 'maps' : 'mods'}/${r.id}`}
                  className={`font-medium ${REGISTRY_LINK_HOVER_CLS}`}
                  style={registryLinkStyle(color)}
                >
                  {r.name}
                </Link>
              </td>
              <td
                className={`${TABLE_CELL_NUMERIC_CLS} font-black`}
                style={{ color }}
              >
                {r.total_downloads.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function RegistryAuthorPage({
  data,
  author,
  dailyData,
}: {
  data: RegistryAnalyticsData;
  author: string;
  dailyData: DailyDataPoint[];
}) {
  const analytics = getAuthorAnalytics(data, author, dailyData);
  const authorRow = analytics.author;
  const displayName = authorRow ? getAuthorDisplayName(authorRow) : author;

  const totalDownloads =
    authorRow?.total_downloads ??
    [...analytics.maps, ...analytics.mods].reduce(
      (s, r) => s + r.total_downloads,
      0,
    );

  const mapDownloads = analytics.maps.reduce(
    (s, r) => s + r.total_downloads,
    0,
  );
  const modDownloads = analytics.mods.reduce(
    (s, r) => s + r.total_downloads,
    0,
  );
  const attributionHref =
    authorRow?.attribution_link?.trim() ||
    (analytics.githubUsername
      ? `https://github.com/${analytics.githubUsername}`
      : '');
  const attributionLabel = `Open ${displayName} attribution link`;
  const purpleIconStyle = {
    borderColor: 'color-mix(in srgb, var(--primary) 35%, transparent)',
    backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
    color: 'var(--primary)',
  };
  const modIconStyle = {
    borderColor: `${MOD_COLOR}59`,
    backgroundColor: `${MOD_COLOR}1a`,
    color: MOD_COLOR,
  };
  const mapIconStyle = {
    borderColor: `${MAP_COLOR}59`,
    backgroundColor: `${MAP_COLOR}1a`,
    color: MAP_COLOR,
  };

  return (
    <RegistryDetailShell
      title={
        authorRow ? (
          <AuthorName author={authorRow} contributorVariant="pill" />
        ) : (
          displayName
        )
      }
      snapshotLabel={data.snapshotLabel}
      actions={
        attributionHref ? (
          <a
            href={attributionHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/45 hover:text-foreground"
            aria-label={attributionLabel}
          >
            <ExternalLink className="size-4" />
          </a>
        ) : null
      }
    >
      {/* Summary stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link
          href="/registry?tab=authors#author-rankings"
          className="block rounded-xl"
        >
          <Stat>
            <StatIndicator variant="icon" style={purpleIconStyle}>
              <Trophy />
            </StatIndicator>
            <StatLabel className={STAT_HEADER_CLS}>Author Rank</StatLabel>
            <StatValue>{authorRow ? `#${authorRow.rank}` : '—'}</StatValue>
            <StatDescription>by total downloads</StatDescription>
          </Stat>
        </Link>

        <Stat>
          <StatIndicator variant="icon" style={purpleIconStyle}>
            <Download />
          </StatIndicator>
          <StatLabel className={STAT_HEADER_CLS}>Total Downloads</StatLabel>
          <StatValue>{totalDownloads.toLocaleString()}</StatValue>
          <StatDescription>across all listings</StatDescription>
        </Stat>

        <Stat>
          <StatIndicator variant="icon" style={modIconStyle}>
            <Package />
          </StatIndicator>
          <StatLabel className={STAT_HEADER_CLS}>Mods Published</StatLabel>
          <StatValue>{analytics.mods.length}</StatValue>
          <StatDescription>
            {modDownloads.toLocaleString()} downloads
          </StatDescription>
        </Stat>

        <Stat>
          <StatIndicator variant="icon" style={mapIconStyle}>
            <Map />
          </StatIndicator>
          <StatLabel className={STAT_HEADER_CLS}>Maps Published</StatLabel>
          <StatValue>{analytics.maps.length}</StatValue>
          <StatDescription>
            {mapDownloads.toLocaleString()} downloads
          </StatDescription>
        </Stat>
      </div>

      {/* Daily download history */}
      {analytics.dailyData.length > 0 && (
        <section className="mb-12">
          <SectionHeader icon={History} title="Download History" />
          <div className="rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
            <DailyDownloadChart
              data={analytics.dailyData}
              color="var(--primary)"
              height={200}
            />
          </div>
        </section>
      )}

      {/* Mods */}
      {analytics.mods.length > 0 && (
        <section className="mb-12">
          <SectionHeader icon={Package} title="Mods" accent={MOD_COLOR} />
          <ListingsTable
            listings={analytics.mods}
            type="mod"
            color={MOD_COLOR}
          />
        </section>
      )}

      {/* Maps */}
      {analytics.maps.length > 0 && (
        <section className="mb-12">
          <SectionHeader icon={Map} title="Maps" accent={MAP_COLOR} />
          <ListingsTable
            listings={analytics.maps}
            type="map"
            color={MAP_COLOR}
          />
        </section>
      )}
    </RegistryDetailShell>
  );
}
