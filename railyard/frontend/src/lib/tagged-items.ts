import { compareItems as sharedCompareItems } from '@subway-builder-modded/asset-listings-ui';

import type { types } from '../../wailsjs/go/models';

export type TaggedItem =
  | { type: 'mod'; item: types.ModManifest }
  | { type: 'map'; item: types.MapManifest };

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
  // Retired items always sort last regardless of the selected sort field
  // (including random) — active, then deprecated, then deleted; the selected
  // sort applies within each partition.
  const rank = (entry: TaggedItem): number =>
    entry.item.deprecation == null
      ? 0
      : entry.item.deprecation.deleted === true
        ? 2
        : 1;
  const aRank = rank(a);
  const bRank = rank(b);
  if (aRank !== bRank) {
    return aRank - bRank;
  }
  return sharedCompareItems(a, b, sort, modDownloadTotals, mapDownloadTotals, {
    getAuthor: (item) =>
      typeof item.author === 'string'
        ? item.author
        : (item.author?.author_alias ?? ''),
    getCityCode: (item) =>
      'city_code' in item && typeof item.city_code === 'string'
        ? item.city_code
        : '',
  });
}
