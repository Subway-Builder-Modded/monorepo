import { RegistryItemCard } from "@/shared/registry-card/registry-item-card";
import type { RegistryTypeConfig } from "@/shared/registry-card/registry-item-types";
import type { RegistryItemBase } from "@/features/registry/lib/registry-types";
import { cn } from "@/lib/utils";

export type RegistryContentItem = RegistryItemBase;

type RegistryListingCardProps = {
  item: RegistryContentItem;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
};

const MAP_TYPE_CONFIG: RegistryTypeConfig = {
  id: "maps",
  label: "Map",
  pluralLabel: "Maps",
  routeSegment: "maps",
  accentLight: "#2563eb",
  accentDark: "#60a5fa",
};

const MOD_TYPE_CONFIG: RegistryTypeConfig = {
  id: "mods",
  label: "Mod",
  pluralLabel: "Mods",
  routeSegment: "mods",
  accentLight: "#dc2626",
  accentDark: "#f87171",
};

function getTypeConfig(kind: "map" | "mod"): RegistryTypeConfig {
  return kind === "map" ? MAP_TYPE_CONFIG : MOD_TYPE_CONFIG;
}

/**
 * Thin wrapper around the canonical RegistryItemCard for backward compatibility.
 * Renders the compact variant, matching the existing carousel card appearance.
 */
export function RegistryListingCard({
  item,
  onMouseEnter,
  onMouseLeave,
  className,
}: RegistryListingCardProps) {
  const typeConfig = getTypeConfig(item.kind);
  const cardData = {
    id: item.id,
    href: item.href,
    title: item.title,
    author: item.author,
    authorId: item.authorId ?? item.author,
    description: item.description,
    thumbnailSrc: item.thumbnailSrc,
    totalDownloads: item.totalDownloads,
    tags: [],
    cityCode: item.cityCode,
    countryCode: item.countryCode,
    countryName: item.countryName,
    countryEmoji: item.countryEmoji,
    population: item.population,
  };

  return (
    <RegistryItemCard
      data={cardData}
      typeConfig={typeConfig}
      variant="grid"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn("w-[min(22rem,80vw)] shrink-0 lg:w-[min(24rem,44vw)]", className)}
    />
  );
}
