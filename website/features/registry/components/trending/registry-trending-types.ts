'use client';

import type {
  RegistryAnalyticsData,
  RegistryListingDailyRow,
  RegistryTrendingRow,
} from '@/types/registry-analytics';

export type TrendingModeKey = '1d' | '3d' | '7d';

export const TRENDING_MODE_LABELS: Record<TrendingModeKey, string> = {
  '1d': 'Last Day',
  '3d': 'Last 3 Days',
  '7d': 'Last Week',
};

export function getModeDays(mode: TrendingModeKey): number {
  if (mode === '1d') return 1;
  if (mode === '3d') return 3;
  return 7;
}

export type EnrichedTrendingRow = RegistryTrendingRow & {
  totalDownloads: number;
  dailyData: RegistryListingDailyRow['dailyData'];
};

export function getModeRows(
  data: RegistryAnalyticsData,
  mode: TrendingModeKey,
): RegistryTrendingRow[] {
  if (mode === '1d') return data.trending1d;
  if (mode === '3d') return data.trending3d;
  return data.trending7d;
}

function buildDailyLookup(
  rows: RegistryListingDailyRow[],
): Map<string, RegistryListingDailyRow['dailyData']> {
  const map = new Map<string, RegistryListingDailyRow['dailyData']>();
  for (const row of rows) {
    map.set(`${row.listing_type}:${row.id}`, row.dailyData);
  }
  return map;
}

function enrichRows(
  data: RegistryAnalyticsData,
  rows: RegistryTrendingRow[],
  listingDailyData: RegistryListingDailyRow[],
): EnrichedTrendingRow[] {
  const dailyLookup = buildDailyLookup(listingDailyData);

  return rows.map((row) => {
    const allTime = data.allTime.find(
      (entry) => entry.listing_type === row.listing_type && entry.id === row.id,
    );

    return {
      ...row,
      totalDownloads: allTime?.total_downloads ?? row.current_total,
      dailyData: dailyLookup.get(`${row.listing_type}:${row.id}`) ?? [],
    };
  });
}

export function getTopTrendingByType({
  data,
  listingDailyData,
  mode,
  type,
  limit = 10,
}: {
  data: RegistryAnalyticsData;
  listingDailyData: RegistryListingDailyRow[];
  mode: TrendingModeKey;
  type: 'map' | 'mod';
  limit?: number;
}): EnrichedTrendingRow[] {
  const modeRows = getModeRows(data, mode).filter(
    (row) => row.listing_type === type,
  );
  const sortedRows = [...modeRows].sort(
    (a, b) => b.download_change - a.download_change,
  );
  return enrichRows(data, sortedRows.slice(0, limit), listingDailyData);
}
