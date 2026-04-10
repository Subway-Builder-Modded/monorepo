'use client';

import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@subway-builder-modded/shared-ui';
import { PageHeader } from '@/components/shared/page-header';
import type {
  RegistryAnalyticsData,
  RegistryListingDailyRow,
} from '@/types/registry-analytics';
import {
  TRENDING_MODE_LABELS,
  type TrendingModeKey,
  getTopTrendingByType,
} from './trending/registry-trending-types';
import { RegistryTrendingTypeSection } from './trending/registry-trending-type-section';
import { MAP_COLOR, MOD_COLOR } from './registry-shared';
import { usePersistedState } from '@/lib/use-persisted-state';

const PAGE_HEADER_SCHEME = {
  accent: { light: '#9d4edd', dark: '#c77dff' },
};

export function RegistryTrendingPage({
  data,
  listingDailyData,
}: {
  data: RegistryAnalyticsData;
  listingDailyData: RegistryListingDailyRow[];
}) {
  const [mode, setMode] = usePersistedState<TrendingModeKey>(
    'registry.trending.mode',
    '1d',
  );
  const [activeType, setActiveType] = usePersistedState<'mod' | 'map'>(
    'registry.trending.type',
    'mod',
  );

  const modRows = useMemo(
    () =>
      getTopTrendingByType({
        data,
        listingDailyData,
        mode,
        type: 'mod',
        limit: 10,
      }),
    [data, listingDailyData, mode],
  );

  const mapRows = useMemo(
    () =>
      getTopTrendingByType({
        data,
        listingDailyData,
        mode,
        type: 'map',
        limit: 10,
      }),
    [data, listingDailyData, mode],
  );

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon={TrendingUp}
        title="Trending"
        description="The most trending content on Railyard based on recent activity."
        colorScheme={PAGE_HEADER_SCHEME}
        badges={[{ text: `Updated: \`${data.snapshotLabel}\`` }]}
      />

      <section className="mt-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-2.5 ring-1 ring-foreground/5">
          <div className="inline-flex rounded-lg border border-border/80 bg-background/80 p-0.5">
            {(['mod', 'map'] as const).map((type) => {
              const isActive = activeType === type;
              const accent = type === 'mod' ? MOD_COLOR : MAP_COLOR;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold uppercase tracking-wider transition-colors"
                  style={
                    isActive
                      ? {
                          color: accent,
                          backgroundColor: `${accent}18`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  {type === 'mod' ? 'Mods' : 'Maps'}
                </button>
              );
            })}
          </div>

          <ToggleGroup
            type="single"
            value={mode}
            variant="default"
            size="sm"
            spacing={1}
            onValueChange={(next) => {
              if (next === '1d' || next === '3d' || next === '7d')
                setMode(next);
            }}
            className="h-8 rounded-lg border border-border/80 bg-background/80 p-0.5"
          >
            {(['1d', '3d', '7d'] as const).map((key) => (
              <ToggleGroupItem
                key={key}
                value={key}
                className="h-7 rounded-md px-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent/45 hover:text-primary data-[state=on]:bg-accent/45 data-[state=on]:text-primary"
              >
                {TRENDING_MODE_LABELS[key]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {activeType === 'mod' ? (
          <RegistryTrendingTypeSection type="mod" rows={modRows} mode={mode} />
        ) : (
          <RegistryTrendingTypeSection type="map" rows={mapRows} mode={mode} />
        )}
      </section>
    </div>
  );
}
