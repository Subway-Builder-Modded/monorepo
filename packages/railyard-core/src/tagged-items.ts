import type { SortDirection, SortState } from './browse-sort';

export interface TaggedModItemBase {
  id: string;
  name?: string | null;
  last_updated?: number | null;
}

export interface TaggedMapItemBase extends TaggedModItemBase {
  city_code?: string | null;
  country?: string | null;
  population?: number | null;
}

export type TaggedItem<
  TMod extends TaggedModItemBase,
  TMap extends TaggedMapItemBase,
> =
  | { type: 'mod'; item: TMod }
  | { type: 'map'; item: TMap };

export function buildTaggedItems<
  TMod extends TaggedModItemBase,
  TMap extends TaggedMapItemBase,
>(mods: TMod[], maps: TMap[]): TaggedItem<TMod, TMap>[] {
  const modItems: TaggedItem<TMod, TMap>[] = mods.map((item) => ({
    type: 'mod',
    item,
  }));
  const mapItems: TaggedItem<TMod, TMap>[] = maps.map((item) => ({
    type: 'map',
    item,
  }));
  return [...modItems, ...mapItems];
}

export function compareByDirection(
  a: number,
  b: number,
  direction: SortDirection,
): number {
  return direction === 'asc' ? a - b : b - a;
}

export function getTotalDownloads<
  TMod extends TaggedModItemBase,
  TMap extends TaggedMapItemBase,
>(
  item: TaggedItem<TMod, TMap>,
  modDownloadTotals: Record<string, number>,
  mapDownloadTotals: Record<string, number>,
): number {
  return item.type === 'mod'
    ? (modDownloadTotals[item.item.id] ?? 0)
    : (mapDownloadTotals[item.item.id] ?? 0);
}

export function getLastUpdated<
  TMod extends TaggedModItemBase,
  TMap extends TaggedMapItemBase,
>(item: TaggedItem<TMod, TMap>): number {
  const timestamp = item.item.last_updated;
  return typeof timestamp === 'number' && Number.isFinite(timestamp)
    ? timestamp
    : 0;
}

export function compareItems<
  TMod extends TaggedModItemBase,
  TMap extends TaggedMapItemBase,
>(
  a: TaggedItem<TMod, TMap>,
  b: TaggedItem<TMod, TMap>,
  sort: SortState,
  modDownloadTotals: Record<string, number>,
  mapDownloadTotals: Record<string, number>,
  getAuthorName: (item: TMod | TMap) => string,
): number {
  const compareText = (
    left: string,
    right: string,
    direction: SortDirection,
  ) =>
    direction === 'asc' ? left.localeCompare(right) : right.localeCompare(left);

  switch (sort.field) {
    case 'name':
      return compareText(a.item.name ?? '', b.item.name ?? '', sort.direction);
    case 'city_code': {
      const cityCodeA = a.type === 'map' ? (a.item.city_code ?? '') : '';
      const cityCodeB = b.type === 'map' ? (b.item.city_code ?? '') : '';
      return compareText(cityCodeA, cityCodeB, sort.direction);
    }
    case 'country': {
      const countryA = a.type === 'map' ? (a.item.country ?? '') : '';
      const countryB = b.type === 'map' ? (b.item.country ?? '') : '';
      return compareText(countryA, countryB, sort.direction);
    }
    case 'author':
      return compareText(
        getAuthorName(a.item),
        getAuthorName(b.item),
        sort.direction,
      );
    case 'population': {
      const popA = a.type === 'map' ? (a.item.population ?? 0) : 0;
      const popB = b.type === 'map' ? (b.item.population ?? 0) : 0;
      return compareByDirection(popA, popB, sort.direction);
    }
    case 'downloads': {
      const downloadsA = getTotalDownloads(a, modDownloadTotals, mapDownloadTotals);
      const downloadsB = getTotalDownloads(b, modDownloadTotals, mapDownloadTotals);
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

export function sortTaggedItemsByLastUpdated<
  TMod extends TaggedModItemBase,
  TMap extends TaggedMapItemBase,
  TItem extends TaggedItem<TMod, TMap>,
>(
  items: TItem[],
  direction: SortDirection = 'desc',
): TItem[] {
  const getUpdatedAt = (item: TItem) => {
    const timestamp = item.item.last_updated;
    return typeof timestamp === 'number' && Number.isFinite(timestamp)
      ? timestamp
      : 0;
  };

  return [...items].sort((a, b) =>
    compareByDirection(getUpdatedAt(a), getUpdatedAt(b), direction),
  );
}