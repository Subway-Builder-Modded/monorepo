import type { RegistrySearchItem } from "./registry-search-types";

/** Collect all unique tags across a set of items. */
export function collectTags(items: RegistrySearchItem[]): string[] {
  const tagSet = new Set<string>();
  for (const item of items) {
    for (const tag of item.tags) {
      tagSet.add(tag);
    }
  }
  return [...tagSet].sort();
}

function hasQueryMatch(values: Array<string | null | undefined>, query: string): boolean {
  return values.some((value) => value?.toLowerCase().includes(query));
}

/** Filter registry items by search query and tag selection.
 * All matches are case-insensitive.
 */
export function filterRegistryItems(
  items: RegistrySearchItem[],
  query: string,
  selectedTags: string[],
): RegistrySearchItem[] {
  const trimmedQuery = query.trim().toLowerCase();
  const hasQuery = trimmedQuery.length > 0;
  const hasTags = selectedTags.length > 0;

  if (!hasQuery && !hasTags) return items;

  return items.filter((item) => {
    // Tag filter (any selected tag must match – OR semantics)
    if (hasTags && !selectedTags.some((tag) => item.tags.includes(tag))) {
      return false;
    }

    if (!hasQuery) return true;

    const q = trimmedQuery;

    return hasQueryMatch(
      [
        item.name,
        item.id,
        item.author,
        ...item.tags,
        ...(item.searchAliases ?? []),
        item.cityCode,
        item.countryCode,
        item.countryName,
      ],
      q,
    );
  });
}
