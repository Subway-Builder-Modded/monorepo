import {
  type AbstractTaggedItem,
  compareByDirection as sharedCompareByDirection,
  compareItems as sharedCompareItems,
  getLastUpdated as sharedGetLastUpdated,
  getTotalDownloads as sharedGetTotalDownloads,
  sortTaggedItemsByLastUpdated as sharedSortTaggedItemsByLastUpdated,
} from '@subway-builder-modded/asset-listings-ui';

import type { types } from '../../wailsjs/go/models';

export type TaggedItem =
  | { type: 'mod'; item: types.ModManifest }
  | { type: 'map'; item: types.MapManifest };

export function compareByDirection(
  a: number,
  b: number,
  direction: 'asc' | 'desc',
): number {
  return sharedCompareByDirection(a, b, direction);
}

export function getTotalDownloads(
  item: TaggedItem,
  modDownloadTotals: Record<string, number>,
  mapDownloadTotals: Record<string, number>,
): number {
  return sharedGetTotalDownloads(item, modDownloadTotals, mapDownloadTotals);
}

export function getLastUpdated(item: TaggedItem): number {
  return sharedGetLastUpdated(item);
}

export function sortTaggedItemsByLastUpdated<T extends TaggedItem>(
  items: T[],
  direction: 'asc' | 'desc' = 'desc',
): T[] {
  return sharedSortTaggedItemsByLastUpdated(items, direction);
}

export function buildTaggedItems(
  mods: types.ModManifest[],
  maps: types.MapManifest[],
): TaggedItem[] {
  const modItems: TaggedItem[] = mods.map((item) => ({ type: 'mod', item }));
  const mapItems: TaggedItem[] = maps.map((item) => ({ type: 'map', item }));
  return [...modItems, ...mapItems];
}

export function compareItems(
  a: TaggedItem,
  b: TaggedItem,
  sort: Parameters<typeof sharedCompareItems>[2],
  modDownloadTotals: Record<string, number>,
  mapDownloadTotals: Record<string, number>,
): number {
  return sharedCompareItems(a, b, sort, modDownloadTotals, mapDownloadTotals, {
    getAuthor: (item) =>
      typeof item.author === 'string'
        ? item.author
        : (item.author?.author_alias ?? ''),
    getCityCode: (item) => item.city_code ?? '',
  });
}
