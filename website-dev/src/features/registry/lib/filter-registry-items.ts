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

    // Generic fields
    if (item.name.toLowerCase().includes(q)) return true;
    if (item.id.toLowerCase().includes(q)) return true;
    if (item.author.toLowerCase().includes(q)) return true;
    if (item.description.toLowerCase().includes(q)) return true;
    if (item.tags.some((t) => t.toLowerCase().includes(q))) return true;

    // Map-specific fields
    if (item.cityCode?.toLowerCase().includes(q)) return true;
    if (item.countryCode?.toLowerCase().includes(q)) return true;
    if (item.countryName?.toLowerCase().includes(q)) return true;

    return false;
  });
}
