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
	'very-high': 'very-high-quality',
	high: 'high-quality',
	medium: 'medium-quality',
	low: 'low-quality',
	'very-low': 'very-low-quality',
	absent: 'absent-quality',
	unknown: 'unknown-quality',
};

export function formatDataQuality(value: string): string {
	return DATA_QUALITY_LABELS[value] ?? value;
}

/**
 * Data-quality tier for display and filtering. The registry guarantees a
 * `data_quality` block on every map manifest; a missing block (stale local
 * clone or snapshot predating the migration) reads as "unknown".
 */
export function resolveDataQualityTier(map: {
	data_quality?: { tier?: string | null } | null;
}): string {
	return map.data_quality?.tier ?? 'unknown';
}

/**
 * Returns the location tag for a map manifest. The registry derives
 * `location` from the map's country code; the legacy `sub_location` bridge
 * field was retired once every manifest carried a sub-region tag directly.
 */
export function resolveMapLocation(map: {
	location?: string | null;
}): string | undefined {
	return map.location ?? undefined;
}

export function buildSpecialDemandValues(
	maps: ReadonlyArray<{ special_demand?: string[] | null }>,
): string[] {
	return [...new Set(maps.flatMap((map) => map.special_demand ?? []))].sort();
}
