'use client';

import {
  LayoutGrid,
  TrendingUp,
  Users,
  Globe,
  Package,
  Database,
} from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { cn } from '@/lib/utils';
import type { RegistryAnalyticsData } from '@/types/registry-analytics';

import { RegistrySummaryStats } from './registry-summary-stats';
import { RegistryTrendingSection } from './registry-trending-section';
import { RegistryAuthorsSection } from './registry-authors-section';
import { RegistryBreakdownSection } from './registry-breakdown-section';
import { RegistryPopulationSection } from './registry-population-section';
import { RegistryDownloadsTimelineSection } from './registry-downloads-timeline-section';
import { usePersistedState } from '@/lib/use-persisted-state';

const PAGE_HEADER_SCHEME = {
  accent: { light: '#9d4edd', dark: '#c77dff' },
};

type TabKey = 'overview' | 'content' | 'authors' | 'population';

const TABS: {
  key: TabKey;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
  { key: 'content', label: 'Content', icon: Package },
  { key: 'authors', label: 'Authors', icon: Users },
  { key: 'population', label: 'Population', icon: Globe },
];

export function RegistryAnalyticsPage({
  data,
}: {
  data: RegistryAnalyticsData;
}) {
  const [active, setActive] = usePersistedState<TabKey>(
    'registry.analytics.active-tab',
    'overview',
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (
      tab === 'overview' ||
      tab === 'content' ||
      tab === 'authors' ||
      tab === 'population'
    ) {
      setActive(tab);
    }
  }, [setActive]);

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon={Database}
        title="Registry"
        description="In-depth analytics and insights for Railyard-hosted content."
        colorScheme={PAGE_HEADER_SCHEME}
        badges={[{ text: `Updated: \`${data.snapshotLabel}\`` }]}
      />

      {/* Tab bar */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
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
        <Link
          href="/registry/trending"
          className="flex min-w-32 items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 hover:text-foreground"
        >
          <TrendingUp className="size-4" />
          Trending
        </Link>
      </div>

      {/* Tab content */}
      {active === 'overview' && (
        <>
          <RegistrySummaryStats data={data} />
          <RegistryDownloadsTimelineSection data={data} />
          <RegistryBreakdownSection data={data} />
        </>
      )}
      {active === 'content' && <RegistryTrendingSection data={data} />}
      {active === 'authors' && <RegistryAuthorsSection data={data} />}
      {active === 'population' && <RegistryPopulationSection data={data} />}
    </div>
  );
}
