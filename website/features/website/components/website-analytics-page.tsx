'use client';

import { useEffect } from 'react';
import { Activity, FileText, Cpu, Globe2, Globe } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { cn } from '@/lib/utils';
import type { WebsiteAnalyticsData } from '@/types/website-analytics';
import { WebsiteOverviewSection } from './website-overview-section';
import { WebsitePagesSection } from './website-pages-section';
import { WebsiteTechnologySection } from './website-technology-section';
import { WebsiteCountriesSection } from './website-countries-section';
import { WEBSITE_PAGE_HEADER_SCHEME } from './website-shared';
import { usePersistedState } from '@/lib/use-persisted-state';

type TabKey = 'overview' | 'pages' | 'countries' | 'technology';

const TABS: {
  key: TabKey;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'pages', label: 'Pages', icon: FileText },
  { key: 'countries', label: 'Countries', icon: Globe2 },
  { key: 'technology', label: 'Technology', icon: Cpu },
];

export function WebsiteAnalyticsPage({ data }: { data: WebsiteAnalyticsData }) {
  const [active, setActive] = usePersistedState<TabKey>(
    'website.analytics.active-tab',
    'overview',
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (
      tab === 'overview' ||
      tab === 'pages' ||
      tab === 'countries' ||
      tab === 'technology'
    ) {
      setActive(tab);
    }
  }, [setActive]);

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon={Globe}
        title="Website"
        description="Central place for docs, analytics, and community resources across all Subway Builder Modded projects."
        colorScheme={WEBSITE_PAGE_HEADER_SCHEME}
        badges={[{ text: `Updated: \`${data.snapshotLabel}\`` }]}
      />

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
      </div>

      {active === 'overview' ? <WebsiteOverviewSection data={data} /> : null}
      {active === 'pages' ? <WebsitePagesSection data={data} /> : null}
      {active === 'countries' ? <WebsiteCountriesSection data={data} /> : null}
      {active === 'technology' ? (
        <WebsiteTechnologySection data={data} />
      ) : null}
    </div>
  );
}
