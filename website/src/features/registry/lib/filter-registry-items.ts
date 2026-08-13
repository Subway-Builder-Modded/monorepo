import type { RegistrySearchItem } from "./registry-search-types";
import type { RegistryVisibility } from "./use-registry-params";

/** matchesVisibility reports whether an item belongs to the visibility class. */
export function matchesVisibility(
  item: Pick<RegistrySearchItem, "isDeprecated" | "isDeleted">,
  visibility: RegistryVisibility,
): boolean {
  if (visibility === "deleted") return item.isDeleted;
  if (visibility === "deprecated") return item.isDeprecated && !item.isDeleted;
  return !item.isDeprecated;
}
import { buildRegistryItemSearchValues, matchesRegistrySearch } from "./registry-search";

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
 * Visibility is exclusive: exactly one retirement class is shown at a time
 * ("available" = neither deprecated nor deleted), mirroring the app's Asset
 * Status facet semantics.
 */
export function filterRegistryItems(
  items: RegistrySearchItem[],
  query: string,
  selectedTags: string[],
  visibility: RegistryVisibility = "available",
): RegistrySearchItem[] {
  const visibleItems = items.filter((item) => matchesVisibility(item, visibility));
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;
  const hasTags = selectedTags.length > 0;

  if (!hasQuery && !hasTags) return visibleItems;

  return visibleItems.filter((item) => {
    // Tag filter (any selected tag must match – OR semantics)
    if (hasTags && !selectedTags.some((tag) => item.tags.includes(tag))) {
      return false;
    }

    if (!hasQuery) return true;

    return matchesRegistrySearch(buildRegistryItemSearchValues(item), trimmedQuery);
  });
}
