import { loadRegistryItemsForType } from "@/features/registry/lib/load-registry-cache";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";
import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";
import type { RegistryItemBase } from "@/features/registry/lib/registry-types";

export type RailyardRegistryAssetKind = "map" | "mod";

export type RailyardLatestRegistryItem = RegistryItemBase & {
  lastActivityAt: number;
};

function toLatestItem(item: RegistrySearchItem): RailyardLatestRegistryItem {
  const kind: RailyardRegistryAssetKind = item.type === "maps" ? "map" : "mod";
  return {
    id: item.id,
    kind,
    href: item.href,
    title: item.name,
    author: item.author,
    authorId: item.authorId,
    description: item.description || "No description provided.",
    thumbnailSrc: item.thumbnailSrc,
    totalDownloads: item.totalDownloads,
    lastActivityAt: item.lastActivityAt,
    cityCode: item.cityCode,
    countryCode: item.countryCode,
    countryName: item.countryName,
    countryEmoji: item.countryEmoji,
    population: item.population,
  };
}

export async function fetchRailyardLatestRegistryItems(): Promise<RailyardLatestRegistryItem[]> {
  const itemsByType = await Promise.all(
    REGISTRY_TYPES.map((type) => loadRegistryItemsForType(type.id, type.routeSegment)),
  );

  return itemsByType
    .flat()
    .map(toLatestItem)
    .sort((a, b) => b.lastActivityAt - a.lastActivityAt)
    .slice(0, 5);
}
