import {
  type AbstractTaggedItem,
  compareByDirection,
  compareItems as sharedCompareItems,
  getLastUpdated,
  getTotalDownloads,
  sortTaggedItemsByLastUpdated,
} from '@subway-builder-modded/asset-listings-ui';

import type { types } from '../../wailsjs/go/models';

export type TaggedItem =
  | { type: 'mod'; item: types.ModManifest }
  | { type: 'map'; item: types.MapManifest };

export {
  compareByDirection,
  getLastUpdated,
  getTotalDownloads,
  sortTaggedItemsByLastUpdated,
};

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
