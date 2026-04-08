import {
  buildTaggedItems as buildSharedTaggedItems,
  compareByDirection,
  compareItems as compareSharedItems,
  getLastUpdated,
  getTotalDownloads,
  sortTaggedItemsByLastUpdated as sortSharedTaggedItemsByLastUpdated,
  type TaggedItem as SharedTaggedItem,
} from '@sbm/shared/railyard-core/tagged-items';

import type { SortDirection, SortState } from '../lib/constants';

import type { types } from '@railyard-app/wailsjs/go/models';

export type TaggedItem = SharedTaggedItem<types.ModManifest, types.MapManifest>;

function getAuthorName(item: types.ModManifest | types.MapManifest): string {
  return item.author.author_alias;
}

export { compareByDirection, getLastUpdated, getTotalDownloads };

export function buildTaggedItems(
  mods: types.ModManifest[],
  maps: types.MapManifest[],
): TaggedItem[] {
  return buildSharedTaggedItems(mods, maps);
}

export function compareItems(
  a: TaggedItem,
  b: TaggedItem,
  sort: SortState,
  modDownloadTotals: Record<string, number>,
  mapDownloadTotals: Record<string, number>,
): number {
  if (sort.field === 'size') {
    return 0;
  }

  return compareSharedItems(
    a,
    b,
    {
      field: sort.field,
      direction: sort.direction,
    },
    modDownloadTotals,
    mapDownloadTotals,
    getAuthorName,
  );
}

export function sortTaggedItemsByLastUpdated<T extends TaggedItem>(
  items: T[],
  direction: SortDirection = 'desc',
): T[] {
  return sortSharedTaggedItemsByLastUpdated(items, direction);
}

