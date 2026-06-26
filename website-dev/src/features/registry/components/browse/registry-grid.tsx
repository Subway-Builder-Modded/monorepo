import { RegistryItemCard } from "@/shared/registry-card/registry-item-card";
import { getRegistryTypeConfigOrDefault } from "@/features/registry/registry-type-config";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";
import type { RegistryCardVariant } from "@/shared/registry-card/registry-item-types";

type RegistryGridProps = {
  items: RegistrySearchItem[];
  typeId: string;
  cardVariant: RegistryCardVariant;
  hideAuthor?: boolean;
  getContributors?: (
    item: RegistrySearchItem,
  ) => Array<{ authorId: string; authorLabel: string }> | undefined;
};

function toCardData(
  item: RegistrySearchItem,
  contributors?: Array<{ authorId: string; authorLabel: string }>,
) {
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

export function RegistryGrid({
  items,
  typeId,
  cardVariant,
  hideAuthor = false,
  getContributors,
}: RegistryGridProps) {
  if (cardVariant === "list") {
    return (
      <ul className="space-y-2">
        {items.map((item) => {
          const typeConfig = getRegistryTypeConfigOrDefault(item.type || typeId);
          return (
            <li key={`${cardVariant}-${item.id}`}>
              <RegistryItemCard
                data={toCardData(item, getContributors?.(item))}
                typeConfig={typeConfig}
                variant="list"
                hideAuthor={hideAuthor}
              />
            </li>
          );
        })}
      </ul>
    );
  }

  if (cardVariant === "full") {
    return (
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {items.map((item) => {
          const typeConfig = getRegistryTypeConfigOrDefault(item.type || typeId);
          return (
            <li key={`${cardVariant}-${item.id}`} className="h-full">
              <RegistryItemCard
                data={toCardData(item, getContributors?.(item))}
                typeConfig={typeConfig}
                variant="full"
                hideAuthor={hideAuthor}
                className="h-full"
              />
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => {
        const typeConfig = getRegistryTypeConfigOrDefault(item.type || typeId);
        return (
          <li key={`${cardVariant}-${item.id}`} className="h-full">
            <RegistryItemCard
              data={toCardData(item, getContributors?.(item))}
              typeConfig={typeConfig}
              variant="grid"
              hideAuthor={hideAuthor}
              className="h-full"
            />
          </li>
        );
      })}
    </ul>
  );
}
