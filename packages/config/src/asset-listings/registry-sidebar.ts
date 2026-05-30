import { buildListingCounts } from './listing-counts';
import {
	DATA_QUALITY_VALUES,
	LEVEL_OF_DETAIL_VALUES,
	LOCATION_TAGS,
} from './map-filter-values';

const MAP_SPECIAL_DEMAND_TAGS = [
	'airports',
	'entertainment',
	'ferries',
	'hospitals',
	'parks',
	'schools',
	'universities',
] as const;

const MOD_CONTENT_TAGS = [
	'cosmetic',
	'gameplay',
	'library',
	'qol',
	'stations',
	'tracks',
	'trains',
	'ui',
	'misc',
] as const;

const MAP_SPECIAL_DEMAND_TAG_SET = new Set<string>(MAP_SPECIAL_DEMAND_TAGS);
const MAP_REGION_TAG_SET = new Set<string>(LOCATION_TAGS);
const MAP_DATA_QUALITY_TAG_SET = new Set<string>(DATA_QUALITY_VALUES);
const MAP_LEVEL_OF_DETAIL_TAG_SET = new Set<string>(LEVEL_OF_DETAIL_VALUES);
const MOD_CONTENT_TAG_SET = new Set<string>(MOD_CONTENT_TAGS);

export type RegistryTagCategoryId =
	| 'regions'
	| 'data-quality'
	| 'level-of-detail'
	| 'special-demand'
	| 'content'
	| 'other';

export interface RegistryTagCategory {
	id: RegistryTagCategoryId;
	label: string;
	tags: string[];
}

interface BuildRegistryTagCategoriesArgs {
	typeId: string;
	availableTags: readonly string[];
	mapSourceQualityValues?: readonly string[];
	mapLevelOfDetailValues?: readonly string[];
}

function inOrder(values: readonly string[], available: Set<string>): string[] {
	return values.filter((value) => available.has(value));
}

export function buildRegistryTagCategories({
	typeId,
	availableTags,
	mapSourceQualityValues = [],
	mapLevelOfDetailValues = [],
}: BuildRegistryTagCategoriesArgs): RegistryTagCategory[] {
	const sorted = [...new Set(availableTags)].sort((a, b) => a.localeCompare(b));

	if (typeId === 'maps') {
		const available = new Set(sorted);
		const manifestDataQuality = new Set(mapSourceQualityValues);
		const manifestDetail = new Set(mapLevelOfDetailValues);

		const regions = inOrder(LOCATION_TAGS, available);
		const dataQuality = DATA_QUALITY_VALUES.filter(
			(tag) => available.has(tag) || manifestDataQuality.has(tag),
		);
		const levelOfDetail = LEVEL_OF_DETAIL_VALUES.filter(
			(tag) => available.has(tag) || manifestDetail.has(tag),
		);
		const specialDemand = sorted.filter((tag) => MAP_SPECIAL_DEMAND_TAG_SET.has(tag));
		const other = sorted.filter(
			(tag) =>
				!MAP_REGION_TAG_SET.has(tag) &&
				!MAP_DATA_QUALITY_TAG_SET.has(tag) &&
				!MAP_LEVEL_OF_DETAIL_TAG_SET.has(tag) &&
				!MAP_SPECIAL_DEMAND_TAG_SET.has(tag),
		);

		const categories: RegistryTagCategory[] = [
			{ id: 'regions', label: 'Regions', tags: regions },
			{ id: 'data-quality', label: 'Data Quality', tags: dataQuality },
			{ id: 'level-of-detail', label: 'Level of Detail', tags: levelOfDetail },
			{ id: 'special-demand', label: 'Special Demand', tags: specialDemand },
			{ id: 'other', label: 'Other', tags: other },
		];
		return categories.filter((group) => group.tags.length > 0);
	}

	const content = sorted.filter((tag) => MOD_CONTENT_TAG_SET.has(tag));
	const other = sorted.filter((tag) => !MOD_CONTENT_TAG_SET.has(tag));

	const categories: RegistryTagCategory[] = [
		{ id: 'content', label: 'Content', tags: content },
		{ id: 'other', label: 'Other', tags: other },
	];
	return categories.filter((group) => group.tags.length > 0);
}

export function buildRegistryTagCounts(
	tagsByItem: ReadonlyArray<readonly string[] | null | undefined>,
): Record<string, number> {
	return buildListingCounts({
		valuesByItem: tagsByItem.map((tags) => tags ?? []),
	});
}

export function formatRegistryTagLabel(categoryId: RegistryTagCategoryId, tag: string): string {
	if (categoryId === 'data-quality') {
		if (tag === 'low-quality') return 'Low Data Quality';
		if (tag === 'medium-quality') return 'Medium Data Quality';
		if (tag === 'high-quality') return 'High Data Quality';
		return tag;
	}

	if (categoryId === 'level-of-detail') {
		if (tag === 'low-detail') return 'Low Detail';
		if (tag === 'medium-detail') return 'Medium Detail';
		if (tag === 'high-detail') return 'High Detail';
		return tag;
	}

	return tag;
}