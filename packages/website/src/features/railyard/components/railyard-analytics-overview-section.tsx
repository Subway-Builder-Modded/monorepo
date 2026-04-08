'use client';

import type { CSSProperties } from 'react';
import { Clock3, Download, FolderArchive, Boxes, Rocket } from 'lucide-react';
import {
  Stat,
  StatDescription,
  StatIndicator,
  StatLabel,
  StatValue,
} from '@/components/ui/stat';
import type { RailyardAnalyticsData } from '@/types/railyard-analytics';
import { RailyardSectionHeader } from './railyard-analytics-shared';

const ICON_STYLE: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--primary) 35%, transparent)',
  backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
  color: 'var(--primary)',
};

const STAT_LABEL_CLS =
  'text-xs font-semibold uppercase tracking-wider text-muted-foreground';

export function RailyardAnalyticsOverviewSection({
  data,
}: {
  data: RailyardAnalyticsData;
}) {
  return (
    <section className="mb-12">
      <RailyardSectionHeader icon={Rocket} title="Overview" />

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat>
          <StatIndicator variant="icon" style={ICON_STYLE}>
            <Download />
          </StatIndicator>
          <StatLabel className={STAT_LABEL_CLS}>
            Total Downloads (Total)
          </StatLabel>
          <StatValue>{data.summary.totalDownloads.toLocaleString()}</StatValue>
          <StatDescription>across all published versions</StatDescription>
        </Stat>

        <Stat>
          <StatIndicator variant="icon" style={ICON_STYLE}>
            <Boxes />
          </StatIndicator>
          <StatLabel className={STAT_LABEL_CLS}>Versions</StatLabel>
          <StatValue>{data.summary.totalVersions}</StatValue>
          <StatDescription>
            latest release: <code>{`v${data.summary.latestVersion}`}</code>
          </StatDescription>
        </Stat>

        <Stat>
          <StatIndicator variant="icon" style={ICON_STYLE}>
            <FolderArchive />
          </StatIndicator>
          <StatLabel className={STAT_LABEL_CLS}>Build Assets</StatLabel>
          <StatValue>{data.summary.totalAssets}</StatValue>
          <StatDescription>all OS packages combined</StatDescription>
        </Stat>

        <Stat>
          <StatIndicator variant="icon" style={ICON_STYLE}>
            <Clock3 />
          </StatIndicator>
          <StatLabel className={STAT_LABEL_CLS}>
            Total Downloads (Last Day)
          </StatLabel>
          <StatValue>
            {data.summary.current1dDownloads.toLocaleString()}
          </StatValue>
          <StatDescription>across all published versions</StatDescription>
        </Stat>

        <Stat>
          <StatIndicator variant="icon" style={ICON_STYLE}>
            <Rocket />
          </StatIndicator>
          <StatLabel className={STAT_LABEL_CLS}>Top Version</StatLabel>
          <StatValue>v{data.summary.topVersion}</StatValue>
          <StatDescription>
            {data.summary.topVersionDownloads.toLocaleString()} downloads
          </StatDescription>
        </Stat>

        <Stat>
          <StatIndicator variant="icon" style={ICON_STYLE}>
            <FolderArchive />
          </StatIndicator>
          <StatLabel className={STAT_LABEL_CLS}>Most Popular OS</StatLabel>
          <StatValue>{data.summary.topOs}</StatValue>
          <StatDescription>
            {data.summary.topOsDownloads.toLocaleString()} downloads
          </StatDescription>
        </Stat>
      </div>
    </section>
  );
}
