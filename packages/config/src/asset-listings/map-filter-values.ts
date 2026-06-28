export const LOCATION_TAGS = [
	'caribbean',
	'central-america',
	'central-asia',
	'central-europe',
	'east-africa',
	'east-asia',
	'east-europe',
	'middle-east',
	'north-africa',
	'north-america',
	'north-europe',
	'oceania',
	'south-america',
	'south-asia',
	'south-europe',
	'southeast-asia',
	'southern-africa',
	'west-africa',
	'west-europe',
] as const;

export const DATA_QUALITY_VALUES = [
	'low-quality',
	'medium-quality',
	'high-quality',
] as const;

// Alias retained for compatibility with existing source-quality naming in desktop app code.
export const SOURCE_QUALITY_VALUES = DATA_QUALITY_VALUES;

const DATA_QUALITY_LABELS: Record<string, string> = {
	'low-quality': 'low-data-quality',
	'medium-quality': 'medium-data-quality',
	'high-quality': 'high-data-quality',
};

export function formatDataQuality(value: string): string {
	return DATA_QUALITY_LABELS[value] ?? value;
}

// Alias retained for compatibility with existing source-quality naming in desktop app code.
export function formatSourceQuality(value: string): string {
	return formatDataQuality(value);
}

export const LEVEL_OF_DETAIL_VALUES = [
	'low-detail',
	'medium-detail',
	'high-detail',
] as const;

/**
 * Returns the most specific location tag available for a map manifest.
 * Prefers `sub_location` (e.g. "central-europe") over the `location` field ("europe") so that display and filtering automatically use sub-regions. Location is kept for backwards compatibility until the next app version.
 */
export function resolveMapLocation(map: {
	location?: string | null;
	sub_location?: string | null;
}): string | undefined {
	// TODO: this function can be simplified to just `location`.
	return map.sub_location ?? map.location ?? undefined;
}

export function buildSpecialDemandValues(
	maps: ReadonlyArray<{ special_demand?: string[] | null }>,
): string[] {
	return [...new Set(maps.flatMap((map) => map.special_demand ?? []))].sort();
}
