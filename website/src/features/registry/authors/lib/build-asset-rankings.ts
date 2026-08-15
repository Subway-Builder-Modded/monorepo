import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";
import {
  extractDailyDownloadHistory,
  getTypeIdForDailyListingType,
} from "@/features/registry/lib/daily-credit-attribution";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";

/**
 * Asset rankings for the entity pages' analytics band. The table follows the
 * band's shared period and total/maps/mods toggles, so every cut is
 * precomputed here rather than derived in the component.
 */

export type RegistryAssetRankingRow = {
  id: string;
  typeId: string;
  name: string;
  href: string;
  downloads: number;
  /** Position among every registry listing in the same cut; null when it saw no downloads. */
  rank: number | null;
};

export type RegistryAssetRankingMode = "total" | "maps" | "mods";

export type RegistryAssetRankings = Record<
  string,
  Record<RegistryAssetRankingMode, RegistryAssetRankingRow[]>
>;

/** Mirrors the shared analytics period toggle; null days means the all-time cut. */
const RANKING_PERIODS: ReadonlyArray<{ id: string; days: number | null }> = [
  { id: "all-time", days: null },
  { id: "1d", days: 1 },
  { id: "3d", days: 3 },
  { id: "7d", days: 7 },
  { id: "14d", days: 14 },
  { id: "30d", days: 30 },
];

function getListingKey(item: RegistrySearchItem) {
  return `${item.type}:${item.id}`;
}

/** Trailing-window downloads per listing, keyed like the credit lookups. */
function sumWindowDownloadsByListing(
  dailyRows: Array<Record<string, string>>,
  days: number,
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const row of dailyRows) {
    const typeId = getTypeIdForDailyListingType(row["listing_type"]);
    const id = row["id"] ?? "";
    if (!typeId || !id) continue;

    let downloads = 0;
    for (const point of extractDailyDownloadHistory(row).slice(-days)) {
      if (point.downloads > 0) downloads += point.downloads;
    }
    if (downloads > 0) totals.set(`${typeId}:${id}`, downloads);
  }

  return totals;
}

function buildRows(
  entityItems: RegistrySearchItem[],
  allItems: RegistrySearchItem[],
  getDownloads: (item: RegistrySearchItem) => number | null,
): RegistryAssetRankingRow[] {
  const rankByListing = new Map<string, number>();
  allItems
    .map((item) => ({ key: getListingKey(item), value: getDownloads(item) }))
    .filter((entry): entry is { key: string; value: number } => entry.value !== null)
    .sort((left, right) => right.value - left.value)
    .forEach((entry, index) => rankByListing.set(entry.key, index + 1));

  return entityItems.map((item) => ({
    id: item.id,
    typeId: item.type,
    name: item.name,
    href: item.href,
    downloads: getDownloads(item) ?? 0,
    rank: rankByListing.get(getListingKey(item)) ?? null,
  }));
}

/**
 * One ranking table per (period, mode). Ranks are registry-wide within the cut:
 * "maps"/"mods" rank against listings of that type, "total" against all of them.
 */
export function buildAssetRankings(
  entityItemsByType: Record<string, RegistrySearchItem[]>,
  allItemsByType: Record<string, RegistrySearchItem[]>,
  dailyRows: Array<Record<string, string>>,
): RegistryAssetRankings {
  const flatten = (byType: Record<string, RegistrySearchItem[]>) =>
    REGISTRY_TYPES.flatMap((typeConfig) => byType[typeConfig.id] ?? []);
  const entityItems = flatten(entityItemsByType);
  const allItems = flatten(allItemsByType);

  return Object.fromEntries(
    RANKING_PERIODS.map(({ id, days }) => {
      // All-time uses the authoritative lifetime counts; shorter cuts sum the
      // by-day CSV, which only covers the window the analytics run publishes.
      const windowTotals = days === null ? null : sumWindowDownloadsByListing(dailyRows, days);
      const getDownloads = (item: RegistrySearchItem) =>
        windowTotals
          ? (windowTotals.get(getListingKey(item)) ?? null)
          : Number.isFinite(item.totalDownloads)
            ? item.totalDownloads
            : null;

      return [
        id,
        {
          total: buildRows(entityItems, allItems, getDownloads),
          maps: buildRows(entityItemsByType.maps ?? [], allItemsByType.maps ?? [], getDownloads),
          mods: buildRows(entityItemsByType.mods ?? [], allItemsByType.mods ?? [], getDownloads),
        },
      ];
    }),
  );
}
