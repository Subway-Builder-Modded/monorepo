import type { RegistrySearchItem } from "./registry-search-types";
import type { RegistryListingStatus } from "./use-registry-params";

/** listingStatusOf classifies a listing's registry-side lifecycle state. */
export function listingStatusOf(
  item: Pick<RegistrySearchItem, "isDeprecated" | "isDeleted">,
): RegistryListingStatus {
  if (item.isDeleted) return "deleted";
  return item.isDeprecated ? "deprecated" : "active";
}

/** matchesListingStatus reports whether an item falls in the selected union
 * of listing-status classes (never empty — see toggleListingStatus). */
export function matchesListingStatus(
  item: Pick<RegistrySearchItem, "isDeprecated" | "isDeleted">,
  selected: readonly RegistryListingStatus[],
): boolean {
  return selected.includes(listingStatusOf(item));
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
 * Listing status is a composable union (never empty, Active by default),
 * mirroring the app's Status group.
 */
export function filterRegistryItems(
  items: RegistrySearchItem[],
  query: string,
  selectedTags: string[],
  listingStatuses: readonly RegistryListingStatus[] = ["active"],
): RegistrySearchItem[] {
  const visibleItems = items.filter((item) => matchesListingStatus(item, listingStatuses));
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
