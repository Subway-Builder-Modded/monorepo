import { RegistryItemCard } from "@/shared/registry-card/registry-item-card";
import { getRegistryTypeConfigOrDefault } from "@/features/registry/registry-type-config";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";
import type { RegistryCardVariant } from "@/shared/registry-card/registry-item-types";

type RegistryGridProps = {
  items: RegistrySearchItem[];
  typeId: string;
  cardVariant: RegistryCardVariant;
};

function toCardData(item: RegistrySearchItem) {
  return {
    id: item.id,
    href: item.href,
    title: item.name,
    author: item.author,
    authorId: item.authorId,
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

export function RegistryGrid({ items, typeId, cardVariant }: RegistryGridProps) {
  const typeConfig = getRegistryTypeConfigOrDefault(typeId);

  if (cardVariant === "list") {
    return (
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={`${cardVariant}-${item.id}`}>
            <RegistryItemCard data={toCardData(item)} typeConfig={typeConfig} variant="list" />
          </li>
        ))}
      </ul>
    );
  }

  if (cardVariant === "full") {
    return (
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <li key={`${cardVariant}-${item.id}`} className="h-full">
            <RegistryItemCard
              data={toCardData(item)}
              typeConfig={typeConfig}
              variant="full"
              className="h-full"
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <li key={`${cardVariant}-${item.id}`} className="h-full">
          <RegistryItemCard
            data={toCardData(item)}
            typeConfig={typeConfig}
            variant="grid"
            className="h-full"
          />
        </li>
      ))}
    </ul>
  );
}
