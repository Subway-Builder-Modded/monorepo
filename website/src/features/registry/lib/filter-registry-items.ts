import type { RegistrySearchItem } from "./registry-search-types";
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
 * Deprecated and deleted items are excluded unless their respective toggle
 * is set — each only ever surfaces behind its own explicit browse toggle.
 */
export function filterRegistryItems(
  items: RegistrySearchItem[],
  query: string,
  selectedTags: string[],
  showDeprecated = false,
  showDeleted = false,
): RegistrySearchItem[] {
  const visibleItems = items.filter((item) =>
    item.isDeleted ? showDeleted : item.isDeprecated ? showDeprecated : true,
  );
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
