import type { RegistryCardData } from "@/shared/registry-card/registry-item-types";
import type { RegistrySearchItem } from "./registry-search-types";

/** Map a registry search item to the render-ready card data shape. */
export function toRegistryCardData(
  item: RegistrySearchItem,
  contributors?: Array<{ authorId: string; authorLabel: string }>,
): RegistryCardData {
  return {
    id: item.id,
    href: item.href,
    title: item.name,
    author: item.author,
    authorId: item.authorId,
    contributors,
    description: item.description,
    thumbnailSrc: item.thumbnailSrc,
    totalDownloads: item.totalDownloads,
    tags: item.tags,
    cityCode: item.cityCode,
    countryCode: item.countryCode,
    countryName: item.countryName,
    countryEmoji: item.countryEmoji,
    population: item.population,
  };
}
