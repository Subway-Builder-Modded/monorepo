import type { SortDirection, SortState } from '@subway-builder-modded/config';

/**
 * Generic tagged item type that works with any manifest types.
 * Platform-specific implementations define their own TaggedItem union.
 */
export interface AbstractTaggedItem {
  type: 'mod' | 'map';
  item: Record<string, any>;
}

export function compareByDirection(
  a: number,
  b: number,
  direction: SortDirection,
): number {
  return direction === 'asc' ? a - b : b - a;
}

export function getTotalDownloads(
  item: AbstractTaggedItem,
  modDownloadTotals: Record<string, number>,
  mapDownloadTotals: Record<string, number>,
): number {
  return item.type === 'mod'
    ? (modDownloadTotals[item.item.id] ?? 0)
    : (mapDownloadTotals[item.item.id] ?? 0);
}

export function getLastUpdated(item: AbstractTaggedItem): number {
  const timestamp = item.item.last_updated;
  return typeof timestamp === 'number' && Number.isFinite(timestamp)
    ? timestamp
    : 0;
}

/**
 * Generic comparison function for tagged items (mods and maps).
 * Supports different data structures through flexible field access.
 */
export function compareItems<T extends AbstractTaggedItem>(
  a: T,
  b: T,
  sort: SortState,
  modDownloadTotals: Record<string, number>,
  mapDownloadTotals: Record<string, number>,
  options?: {
    getAuthor?: (item: T['item']) => string;
    getCityCode?: (item: T['item']) => string;
  },
): number {
  const compareText = (
    left: string,
    right: string,
    direction: SortDirection,
  ) =>
    direction === 'asc' ? left.localeCompare(right) : right.localeCompare(left);

  const getAuthorDefault = (item: T['item']) =>
    typeof item.author === 'string'
      ? item.author
      : item.author?.author_alias ?? '';

  const getCityCodeDefault = (item: T['item']) =>
    a.type === 'map' ? item.city_code ?? '' : '';

  const getAuthor = options?.getAuthor ?? getAuthorDefault;
  const getCityCode = options?.getCityCode ?? getCityCodeDefault;

  switch (sort.field) {
    case 'name':
      return compareText(a.item.name ?? '', b.item.name ?? '', sort.direction);
    case 'city_code': {
      const cityCodeA =
        a.type === 'map' ? getCityCode(a.item) : '';
      const cityCodeB =
        b.type === 'map' ? getCityCode(b.item) : '';
      return compareText(cityCodeA, cityCodeB, sort.direction);
    }
    case 'country': {
      const countryA =
        a.type === 'map' ? (a.item.country ?? '') : '';
      const countryB =
        b.type === 'map' ? (b.item.country ?? '') : '';
      return compareText(countryA, countryB, sort.direction);
    }
    case 'author':
      return compareText(
        getAuthor(a.item),
        getAuthor(b.item),
        sort.direction,
      );
    case 'population': {
      const popA =
        a.type === 'map' ? (a.item.population ?? 0) : 0;
      const popB =
        b.type === 'map' ? (b.item.population ?? 0) : 0;
      return compareByDirection(popA, popB, sort.direction);
    }
    case 'downloads': {
      const downloadsA = getTotalDownloads(
        a,
        modDownloadTotals,
        mapDownloadTotals,
      );
      const downloadsB = getTotalDownloads(
        b,
        modDownloadTotals,
        mapDownloadTotals,
      );
      return compareByDirection(downloadsA, downloadsB, sort.direction);
    }
    case 'last_updated': {
      const updatedA = getLastUpdated(a);
      const updatedB = getLastUpdated(b);
      return compareByDirection(updatedA, updatedB, sort.direction);
    }
    default:
      return 0;
  }
}

export function sortTaggedItemsByLastUpdated<T extends AbstractTaggedItem>(
  items: T[],
  direction: SortDirection = 'desc',
): T[] {
  return [...items].sort((a, b) =>
    compareItems(a, b, { field: 'last_updated', direction }, {}, {}),
  );
}
