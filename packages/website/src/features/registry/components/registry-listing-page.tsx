'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Download,
  Github,
  MapPin,
  Package,
  TrainTrack,
  TrendingUp,
  History,
  Trophy,
  BadgeCheck,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Stat,
  StatDescription,
  StatIndicator,
  StatLabel,
  StatValue,
} from '@/components/ui/stat';
import type {
  DailyDataPoint,
  ListingType,
  RegistryAnalyticsData,
} from '@/types/registry-analytics';
import {
  getListingAnalytics,
  type ListingAnalytics,
} from '@/lib/registry-analytics-helpers';
import {
  DailyDownloadChart,
  REGISTRY_LINK_HOVER_CLS,
  getListingColor,
  RankBadge,
  RegistryDetailShell,
  SectionHeader,
  TABLE_HEADER_CLS,
  TABLE_HEADER_RIGHT_CLS,
  TABLE_CELL_CLS,
  TABLE_CELL_NUMERIC_CLS,
  TABLE_ROW_CLS,
  TypeBadge,
  registryLinkStyle,
  trimLeadingZeroDailyData,
} from './registry-shared';
import { AuthorName } from '@/components/shared/author-name';
import { SortableNumberHeader } from '@/components/shared/sortable-number-header';
import { usePersistedState } from '@/lib/use-persisted-state';
import { RegistryMapPreview } from '@/features/registry/components/registry-map-preview';

const STAT_HEADER_CLS =
  'text-xs font-semibold uppercase tracking-wider text-muted-foreground';

// ---------------------------------------------------------------------------
// Trend table
// ---------------------------------------------------------------------------

function TrendRow({
  color,
  label,
  change,
  rank,
}: {
  color: string;
  label: string;
  change: number | undefined;
  rank: number | undefined;
}) {
  if (change === undefined) {
    return (
      <tr className={TABLE_ROW_CLS}>
        <td className={`${TABLE_CELL_CLS} text-foreground`}>
          <span>{label}</span>
        </td>
        <td className={`${TABLE_CELL_NUMERIC_CLS} text-muted-foreground/50`}>
          —
        </td>
        <td className={TABLE_CELL_CLS}>
          {rank != null ? (
            <RankBadge rank={rank} />
          ) : (
            <span className="inline-flex size-6 items-center justify-center rounded-sm border border-border bg-muted/50 text-xs font-bold text-muted-foreground">
              —
            </span>
          )}
        </td>
      </tr>
    );
  }
  return (
    <tr className={TABLE_ROW_CLS}>
      <td className={`${TABLE_CELL_CLS} text-foreground`}>
        <span>{label}</span>
      </td>
      <td
        className={`${TABLE_CELL_NUMERIC_CLS} font-semibold`}
        style={{ color }}
      >
        {change.toLocaleString()}
      </td>
      <td className={TABLE_CELL_CLS}>
        {rank != null ? (
          <RankBadge rank={rank} />
        ) : (
          <span className="inline-flex size-6 items-center justify-center rounded-sm border border-border bg-muted/50 text-xs font-bold text-muted-foreground">
            —
          </span>
        )}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Population card (maps only)
// ---------------------------------------------------------------------------

function PopulationCard({ analytics }: { analytics: ListingAnalytics }) {
  const pop = analytics.population;
  if (!pop) return null;
  const rawCountry = pop.country?.trim() ?? '';
  const codeGuess =
    rawCountry.length === 2
      ? rawCountry.toUpperCase()
      : (pop.city_code.split(/[-_]/)[0]?.toUpperCase() ?? '');
  const flag = /^[A-Z]{2}$/.test(codeGuess)
    ? String.fromCodePoint(
        ...codeGuess.split('').map((c) => 127397 + c.charCodeAt(0)),
      )
    : '';
  const countrySub = flag ? `${flag} ${rawCountry}` : rawCountry;

  return (
    <section className="mb-12">
      <SectionHeader icon={MapPin} title="Map Details" accent="#1c7ed6" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'City', value: pop.city_code, sub: countrySub },
          {
            label: 'Population',
            value: pop.population.toLocaleString(),
            sub: `${pop.population_count.toLocaleString()} pops`,
          },
          {
            label: 'Demand Points',
            value: pop.points_count.toLocaleString(),
            sub: 'total demand points',
          },
          {
            label: 'Population Rank',
            value: `#${pop.rank}`,
            sub: 'by population size',
            href: '/registry?tab=population#population-rankings',
          },
        ].map(({ label, value, sub, href }) =>
          href ? (
            <Link
              key={label}
              href={href}
              className="rounded-xl border border-border bg-card p-4 ring-1 ring-foreground/5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">
                {value}
              </p>
              {sub && (
                <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
              )}
            </Link>
          ) : (
            <div
              key={label}
              className="rounded-xl border border-border bg-card p-4 ring-1 ring-foreground/5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">
                {value}
              </p>
              {sub && (
                <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
              )}
            </div>
          ),
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Siblings section
// ---------------------------------------------------------------------------

function SiblingsSection({
  analytics,
  type,
}: {
  analytics: ListingAnalytics;
  type: ListingType;
}) {
  const accent = getListingColor(type);
  const [sortDirection, setSortDirection] = usePersistedState<'asc' | 'desc'>(
    `registry.listing.${type}.siblings.sort.direction`,
    'desc',
  );
  const sortedSiblings = useMemo(() => {
    const ordered = [...analytics.siblings].sort((left, right) => {
      if (left.total_downloads === right.total_downloads) {
        return left.rank - right.rank;
      }
      return sortDirection === 'asc'
        ? left.total_downloads - right.total_downloads
        : right.total_downloads - left.total_downloads;
    });
    return ordered;
  }, [analytics.siblings, sortDirection]);

  if (analytics.siblings.length === 0 || !analytics.project) return null;

  return (
    <section className="mb-12">
      <SectionHeader
        icon={Package}
        title="Also in This Project"
        accent={accent}
      />
      <p className="mb-4 text-sm text-muted-foreground">
        Other listings in{' '}
        <a
          href={`https://github.com/${analytics.project.project_key}`}
          target="_blank"
          rel="noreferrer"
          className={`font-medium ${REGISTRY_LINK_HOVER_CLS}`}
          style={registryLinkStyle(accent)}
        >
          {analytics.project.project_name}
        </a>
        .
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className={TABLE_HEADER_CLS}>Name</th>
              <th className={TABLE_HEADER_CLS}>Type</th>
              <th className={TABLE_HEADER_RIGHT_CLS}>
                <SortableNumberHeader
                  label="Downloads"
                  isActive
                  direction={sortDirection}
                  accentColor={accent}
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
            {sortedSiblings.map((s) => (
              <tr key={s.id} className={TABLE_ROW_CLS}>
                <td className={TABLE_CELL_CLS}>
                  <Link
                    href={`/registry/${s.listing_type === 'map' ? 'maps' : 'mods'}/${s.id}`}
                    className={`font-medium ${REGISTRY_LINK_HOVER_CLS}`}
                    style={registryLinkStyle(getListingColor(s.listing_type))}
                  >
                    {s.name}
                  </Link>
                </td>
                <td className={TABLE_CELL_CLS}>
                  <TypeBadge type={s.listing_type} />
                </td>
                <td
                  className={`${TABLE_CELL_NUMERIC_CLS} font-black`}
                  style={{ color: getListingColor(s.listing_type) }}
                >
                  {s.total_downloads.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function RegistryListingPage({
  data,
  type,
  id,
  dailyData,
  mapMetadata,
}: {
  data: RegistryAnalyticsData;
  type: ListingType;
  id: string;
  dailyData: DailyDataPoint[];
  mapMetadata?: {
    dataQuality?: string | null;
    levelOfDetail?: string | null;
  } | null;
}) {
  const analytics = getListingAnalytics(data, type, id, dailyData);
  const listing = analytics.allTime;
  const color = getListingColor(type);
  const iconStyle = {
    borderColor: `${color}59`,
    backgroundColor: `${color}1a`,
    color,
  };

  if (!listing) {
    return (
      <RegistryDetailShell
        title="Not Found"
        type={type}
        snapshotLabel={data.snapshotLabel}
      >
        <p className="text-muted-foreground">
          No analytics data for this listing.
        </p>
      </RegistryDetailShell>
    );
  }
  const authorHref = `/registry/authors/${encodeURIComponent(listing.author)}`;
  const normalizeQualityValue = (value?: string | null) => {
    const lower = (value ?? '').trim().toLowerCase();
    if (!lower) return null;
    if (lower.includes('high')) return 'High';
    if (lower.includes('medium')) return 'Medium';
    if (lower.includes('low')) return 'Low';
    return null;
  };
  const normalizedDataQuality = normalizeQualityValue(mapMetadata?.dataQuality);
  const normalizedDetail = normalizeQualityValue(mapMetadata?.levelOfDetail);
  const metadataBadges =
    type === 'map'
      ? [
          normalizedDataQuality
            ? {
                icon: BadgeCheck,
                value: normalizedDataQuality,
                tooltip: 'Data Quality',
              }
            : null,
          normalizedDetail
            ? {
                icon: Layers,
                value: normalizedDetail,
                tooltip: 'Level of Detail',
              }
            : null,
        ].filter(
          (
            value,
          ): value is {
            icon: LucideIcon;
            value: string;
            tooltip: string;
          } => Boolean(value),
        )
      : [];

  return (
    <RegistryDetailShell
      title={listing.name}
      subtitle={
        <>
          by{' '}
          <AuthorName
            author={listing}
            href={authorHref}
            linkClassName={`font-medium ${REGISTRY_LINK_HOVER_CLS}`}
            style={registryLinkStyle(color)}
          />
        </>
      }
      type={type}
      snapshotLabel={data.snapshotLabel}
      metadataBadges={metadataBadges}
      actions={
        <>
          <TypeBadge type={type} />
          <Link
            href={`/railyard/${type}s/${id}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:!bg-[var(--action-soft)] hover:text-[var(--action-accent)]"
            style={{
              ['--action-accent' as string]: color,
              ['--action-soft' as string]: `${color}24`,
            }}
            aria-label="Open in Railyard"
          >
            <TrainTrack className="size-4" />
          </Link>
          {analytics.project ? (
            <a
              href={`https://github.com/${analytics.project.project_key}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:!bg-[var(--action-soft)] hover:text-[var(--action-accent)]"
              style={{
                ['--action-accent' as string]: color,
                ['--action-soft' as string]: `${color}24`,
              }}
              aria-label="Open project on GitHub"
            >
              <Github className="size-4" />
            </a>
          ) : null}
        </>
      }
      showTypeBadge={false}
    >
      {/* Summary stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Link
          href={`/registry?tab=content#${type}-rankings`}
          className="block rounded-xl"
        >
          <Stat>
            <StatIndicator variant="icon" style={iconStyle}>
              <Trophy />
            </StatIndicator>
            <StatLabel className={STAT_HEADER_CLS}>
              {type === 'mod' ? 'Mod' : 'Map'} Rank
            </StatLabel>
            <StatValue>#{listing.rank}</StatValue>
            <StatDescription>among {type}s</StatDescription>
          </Stat>
        </Link>

        <Stat>
          <StatIndicator variant="icon" style={iconStyle}>
            <Download />
          </StatIndicator>
          <StatLabel className={STAT_HEADER_CLS}>Total Downloads</StatLabel>
          <StatValue>{listing.total_downloads.toLocaleString()}</StatValue>
          <StatDescription>all-time</StatDescription>
        </Stat>

        <Stat>
          <StatIndicator variant="icon" style={iconStyle}>
            <TrendingUp />
          </StatIndicator>
          <StatLabel className={STAT_HEADER_CLS}>
            Downloads (Last Day)
          </StatLabel>
          <StatValue>
            {analytics.trend1d
              ? analytics.trend1d.download_change.toLocaleString()
              : '—'}
          </StatValue>
          <StatDescription>last 24 hours</StatDescription>
        </Stat>

        <Stat>
          <StatIndicator variant="icon" style={iconStyle}>
            <TrendingUp />
          </StatIndicator>
          <StatLabel className={STAT_HEADER_CLS}>
            Downloads (Last Week)
          </StatLabel>
          <StatValue>
            {analytics.trend7d
              ? analytics.trend7d.download_change.toLocaleString()
              : '—'}
          </StatValue>
          <StatDescription>last 7 days</StatDescription>
        </Stat>
      </div>

      {type === 'map' && (
        <section className="mb-12">
          <PopulationCard analytics={analytics} />

          <SectionHeader
            icon={MapPin}
            title="Population Statistics"
            accent={color}
          />
          <RegistryMapPreview mapId={id} />
        </section>
      )}

      {/* Daily download history */}
      {analytics.dailyData.length > 0 && (
        <section className="mb-12">
          <SectionHeader
            icon={History}
            title="Download History"
            accent={color}
          />
          <div className="rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
            <DailyDownloadChart
              data={trimLeadingZeroDailyData(analytics.dailyData)}
              color={color}
              height={200}
            />
          </div>
        </section>
      )}

      {/* Recent trends */}
      <section className="mb-12">
        <SectionHeader icon={TrendingUp} title="Recent Trends" accent={color} />
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className={TABLE_HEADER_CLS}>Period</th>
                <th className={TABLE_HEADER_RIGHT_CLS}>Downloads</th>
                <th className={TABLE_HEADER_CLS}>Rank</th>
              </tr>
            </thead>
            <tbody>
              <TrendRow
                color={color}
                label="Last 24 Hours"
                change={analytics.trend1d?.download_change}
                rank={analytics.trend1d?.rank}
              />
              <TrendRow
                color={color}
                label="Last 3 Days"
                change={analytics.trend3d?.download_change}
                rank={analytics.trend3d?.rank}
              />
              <TrendRow
                color={color}
                label="Last 7 Days"
                change={analytics.trend7d?.download_change}
                rank={analytics.trend7d?.rank}
              />
            </tbody>
          </table>
        </div>
      </section>

      <SiblingsSection analytics={analytics} type={type} />
    </RegistryDetailShell>
  );
}
