/**
 * Listing status: the registry-side lifecycle of a listing, plus Local for an
 * installed item with no listing at all. Consumers map their own item shape
 * onto the flags below.
 */

export type ListingStatus = 'active' | 'deprecated' | 'deleted' | 'local';

export const LISTING_STATUS_VALUES: readonly ListingStatus[] = [
  'active',
  'deprecated',
  'deleted',
  'local',
];

export interface ListingStatusFlags {
  /** True for any retired listing, deleted included. */
  isDeprecated: boolean;
  isDeleted: boolean;
  /** Installed from disk with no registry listing. */
  isLocal?: boolean;
}

/** Omitting isLocal narrows the return type, so registry-only callers need
 * no cast. */
export function classifyListingStatus(
  flags: ListingStatusFlags & { isLocal?: undefined },
): Exclude<ListingStatus, 'local'>;
export function classifyListingStatus(flags: ListingStatusFlags): ListingStatus;
export function classifyListingStatus(flags: ListingStatusFlags): ListingStatus {
  if (flags.isLocal) return 'local';
  if (flags.isDeleted) return 'deleted';
  return flags.isDeprecated ? 'deprecated' : 'active';
}

/** Whether a status falls in the selected union. */
export function matchesListingStatus(
  status: ListingStatus,
  selected: readonly ListingStatus[],
): boolean {
  return selected.includes(status);
}

export function countListingStatuses<T>(
  items: Iterable<T>,
  classify: (item: T) => ListingStatus,
): Record<ListingStatus, number> {
  const counts: Record<ListingStatus, number> = {
    active: 0,
    deprecated: 0,
    deleted: 0,
    local: 0,
  };
  for (const item of items) {
    counts[classify(item)] += 1;
  }
  return counts;
}

/** Toggle preserving the never-empty invariant: deselecting the last class is a no-op. */
export function toggleListingStatus(
  selected: readonly ListingStatus[],
  status: ListingStatus,
): ListingStatus[] {
  if (!selected.includes(status)) return [...selected, status];
  if (selected.length === 1) return [...selected];
  return selected.filter((value) => value !== status);
}

/** The classes worth offering: those with members. */
export function visibleListingStatuses(
  options: readonly ListingStatus[],
  counts: Record<ListingStatus, number>,
): ListingStatus[] {
  // Selection state deliberately does not keep a class on screen: an empty
  // class never constrains a union filter. Narrowing filters (compatibility,
  // tags) do the opposite, since a selected zero-count option there forces an
  // empty result the user would otherwise be unable to undo.
  return options.filter((key) => (counts[key] ?? 0) > 0);
}

/** Whether deselecting this class would empty the selection. */
export function isListingStatusLocked(
  key: ListingStatus,
  visible: readonly ListingStatus[],
  selected: readonly ListingStatus[],
): boolean {
  // Hidden classes are excluded from the tally — they contribute nothing to
  // the union, so a selection of only-hidden classes is effectively empty.
  const effective = visible.filter((option) => selected.includes(option));
  return effective.length === 1 && effective[0] === key;
}
