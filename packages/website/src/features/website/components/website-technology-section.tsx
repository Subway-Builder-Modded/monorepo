'use client';

import { Cpu } from 'lucide-react';
import type {
  WebsiteAnalyticsData,
  WebsiteAnalyticsPeriod,
} from '@/types/website-analytics';
import { usePersistedState } from '@/lib/use-persisted-state';
import {
  EmptyState,
  WEBSITE_ACCENT_COLOR,
  WebsitePeriodToggle,
  WebsiteSectionHeader,
} from './website-shared';

function TechnologyList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; visits: number }>;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">No data available.</p>
      </div>
    );
  }

  const maxVisits = Math.max(...rows.map((row) => row.visits), 1);

  return (
    <div className="rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="space-y-3">
        {rows.map((row) => {
          const widthPct = Math.max((row.visits / maxVisits) * 100, 2);
          return (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-muted-foreground">
                  {row.label}
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {row.visits.toLocaleString()}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted/55">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: WEBSITE_ACCENT_COLOR,
                    opacity: 0.9,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WebsiteTechnologySection({
  data,
}: {
  data: WebsiteAnalyticsData;
}) {
  const [period, setPeriod] = usePersistedState<WebsiteAnalyticsPeriod>(
    'website.analytics.technology.period',
    '7d',
  );

  const browserRows = data.browsers.slice(0, 8).map((row) => ({
    label: row.browser,
    visits: row.visits[period],
  }));

  const osRows = data.operatingSystems.slice(0, 8).map((row) => ({
    label: row.os,
    visits: row.visits[period],
  }));

  const deviceRows = data.devices.slice(0, 8).map((row) => ({
    label: row.device,
    visits: row.visits[period],
  }));

  const screenRows = data.screenSizes.slice(0, 8).map((row) => ({
    label: row.size,
    visits: row.visits[period],
  }));

  if (
    browserRows.length === 0 &&
    osRows.length === 0 &&
    deviceRows.length === 0 &&
    screenRows.length === 0
  ) {
    return (
      <section className="mb-12">
        <WebsiteSectionHeader icon={Cpu} title="Technology" />
        <EmptyState
          title="No technology data"
          description="Add browser, operating system, or device datasets to populate this tab."
        />
      </section>
    );
  }

  return (
    <section className="mb-12">
      <WebsiteSectionHeader icon={Cpu} title="Technology" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <WebsitePeriodToggle value={period} onChange={setPeriod} includeAll />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <TechnologyList title="Browsers" rows={browserRows} />
        <TechnologyList title="Operating Systems" rows={osRows} />
        <TechnologyList title="Devices" rows={deviceRows} />
        {screenRows.length > 0 ? (
          <TechnologyList title="Screen Sizes" rows={screenRows} />
        ) : null}
      </div>
    </section>
  );
}
