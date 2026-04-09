import {
  buildTaggedItems as buildSharedTaggedItems,
  compareByDirection,
  compareItems as compareSharedItems,
  getLastUpdated,
  getTotalDownloads,
  type TaggedItem as SharedTaggedItem,
} from '@sbm/core/railyard/core/tagged-items';

import type { SortState } from '../../lib/railyard/constants';
import type { MapManifest, ModManifest } from '../../types/registry';

export type TaggedItem = SharedTaggedItem<ModManifest, MapManifest>;

function getAuthorName(item: ModManifest | MapManifest): string {
  return item.author_alias ?? item.author ?? '';
}

export { compareByDirection, getLastUpdated, getTotalDownloads };

export function buildTaggedItems(
  mods: ModManifest[],
  maps: MapManifest[],
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
  return compareSharedItems(
    a,
    b,
    sort,
    modDownloadTotals,
    mapDownloadTotals,
    getAuthorName,
  );
}

