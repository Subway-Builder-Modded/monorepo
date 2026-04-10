'use client';

import { useEffect } from 'react';
import {
  BarChart3,
  LineChart,
  Layers3,
  MonitorCog,
  History,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { cn } from '@subway-builder-modded/shared-ui';
import { usePersistedState } from '@/lib/use-persisted-state';
import type { RailyardAnalyticsData } from '@/types/railyard-analytics';
import { RailyardAnalyticsOverviewSection } from './railyard-analytics-overview-section';
import { RailyardAnalyticsTimelineSection } from './railyard-analytics-timeline-section';
import { RailyardAnalyticsVersionsSection } from './railyard-analytics-versions-section';
import { RailyardAnalyticsOsSection } from './railyard-analytics-os-section';
import { RAILYARD_ANALYTICS_PAGE_HEADER_SCHEME } from './railyard-analytics-shared';

type TabKey = 'overview' | 'timeline' | 'versions' | 'os';

const TABS: {
  key: TabKey;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'timeline', label: 'Timeline', icon: History },
  { key: 'versions', label: 'Versions', icon: Layers3 },
  { key: 'os', label: 'OS Breakdown', icon: MonitorCog },
];

function isValidTabKey(value: unknown): value is TabKey {
  return (
    value === 'overview' ||
    value === 'timeline' ||
    value === 'versions' ||
    value === 'os'
  );
}

export function RailyardAnalyticsPage({
  data,
}: {
  data: RailyardAnalyticsData;
}) {
  const [active, setActive] = usePersistedState<TabKey>(
    'railyard.analytics.active-tab',
    'overview',
  );

  const activeTab = isValidTabKey(active) ? active : 'overview';

  useEffect(() => {
    if (!isValidTabKey(active)) {
      setActive('overview');
    }
  }, [active, setActive]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');

    if (tab === 'assets') {
      setActive('os');
      return;
    }

    if (
      tab === 'overview' ||
      tab === 'timeline' ||
      tab === 'versions' ||
      tab === 'os'
    ) {
      setActive(tab);
    }
  }, [setActive]);

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon={LineChart}
        title="Analytics"
        description="In-depth release and download analytics for the Railyard desktop app."
        colorScheme={RAILYARD_ANALYTICS_PAGE_HEADER_SCHEME}
        badges={[{ text: `Updated: \`${data.snapshotLabel}\`` }]}
      />

      <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={cn(
                'flex min-w-32 items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'border-primary/40 bg-primary/8 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' ? (
        <RailyardAnalyticsOverviewSection data={data} />
      ) : null}
      {activeTab === 'timeline' ? (
        <RailyardAnalyticsTimelineSection data={data} />
      ) : null}
      {activeTab === 'versions' ? (
        <RailyardAnalyticsVersionsSection data={data} />
      ) : null}
      {activeTab === 'os' ? <RailyardAnalyticsOsSection data={data} /> : null}
    </div>
  );
}
