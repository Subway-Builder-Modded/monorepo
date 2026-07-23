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

/**
 * Data-quality tier vocabulary (registry rubric; see the registry's
 * schemas/src/data-quality-ladders.ts, the source of truth). Tiers arrive
 * precomputed on the manifest's `data_quality` block — the app only displays
 * them, so the vocabulary is intentionally re-declared here rather than
 * importing the schemas package. The legacy self-reported `source_quality`
 * field is never read.
 */
export const DATA_QUALITY_TIER_VALUES = [
	'very-high',
	'high',
	'medium',
	'low',
	'very-low',
	'absent',
	'unknown',
] as const;

export type DataQualityTier = (typeof DATA_QUALITY_TIER_VALUES)[number];

const DATA_QUALITY_LABELS: Record<string, string> = {
	'very-high': 'very-high-data-quality',
	high: 'high-data-quality',
	medium: 'medium-data-quality',
	low: 'low-data-quality',
	'very-low': 'very-low-data-quality',
	absent: 'absent-data-quality',
	unknown: 'unscored',
};

export function formatDataQuality(value: string): string {
	return DATA_QUALITY_LABELS[value] ?? value;
}

/**
 * Data-quality tier for display and filtering. The registry guarantees a
 * `data_quality` block on every map manifest; a missing block (stale local
 * clone or snapshot predating the migration) reads as "unknown" (Unscored).
 */
export function resolveDataQualityTier(map: {
	data_quality?: { tier?: string | null } | null;
}): string {
	return map.data_quality?.tier ?? 'unknown';
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
