export const LOCATION_TAGS = [
	'caribbean',
	'central-america',
	'central-asia',
	'central-europe',
	'east-africa',
	'east-asia',
	'east-europe',
	// 'europe' kept so filters still match manifests not yet migrated to sub-regions (≤0.2.3 compat).
	'europe',
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

export function buildSpecialDemandValues(
	maps: ReadonlyArray<{ special_demand?: string[] | null }>,
): string[] {
	return [...new Set(maps.flatMap((map) => map.special_demand ?? []))].sort();
}