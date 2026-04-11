import {
	compareByDirection,
	compareItems as sharedCompareItems,
	getLastUpdated,
	getTotalDownloads,
	sortTaggedItemsByLastUpdated,
} from '@subway-builder-modded/asset-listings-ui';
import type { SortDirection, SortState } from '@/lib/railyard/constants';
import type { MapManifest, ModManifest } from '@/types/registry';

export type TaggedItem =
	| { type: 'mod'; item: ModManifest }
	| { type: 'map'; item: MapManifest };

export { compareByDirection, getLastUpdated, getTotalDownloads, sortTaggedItemsByLastUpdated };

export function buildTaggedItems(
	mods: ModManifest[],
	maps: MapManifest[],
): TaggedItem[] {
	const modItems: TaggedItem[] = mods.map((item) => ({ type: 'mod', item }));
	const mapItems: TaggedItem[] = maps.map((item) => ({ type: 'map', item }));
	return [...modItems, ...mapItems];
}

export function compareItems(
	a: TaggedItem,
	b: TaggedItem,
	sort: SortState,
	modDownloadTotals: Record<string, number>,
	mapDownloadTotals: Record<string, number>,
): number {
	return sharedCompareItems(a, b, sort, modDownloadTotals, mapDownloadTotals, {
		getAuthor: (item) => item.author ?? '',
	});
}
