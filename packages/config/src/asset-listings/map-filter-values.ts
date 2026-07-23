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

/**
 * Data-quality tier vocabulary (registry rubric; see the registry's
 * schemas/src/data-quality-ladders.ts, the source of truth). Tiers arrive
 * precomputed on the manifest's `data_quality` block — the app only displays
 * them, so the vocabulary is intentionally re-declared here rather than
 * importing the schemas package.
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
	// Legacy self-reported source_quality values (field-absent fallback only).
	'low-quality': 'low-data-quality',
	'medium-quality': 'medium-data-quality',
	'high-quality': 'high-data-quality',
	// Data-quality tier values.
	'very-high': 'very-high-data-quality',
	high: 'high-data-quality',
	medium: 'medium-data-quality',
	low: 'low-data-quality',
	'very-low': 'very-low-data-quality',
	absent: 'absent-data-quality',
	unknown: 'unscored',
};

/**
 * Filter option order for the Data Quality dimension: rubric tiers first
 * (best → worst, then unscored), legacy self-report values last — the legacy
 * values only match maps whose manifests predate the registry backfill.
 */
export const EFFECTIVE_DATA_QUALITY_VALUES = [
	...DATA_QUALITY_TIER_VALUES,
	...DATA_QUALITY_VALUES,
] as const;

export function formatDataQuality(value: string): string {
	return DATA_QUALITY_LABELS[value] ?? value;
}

// Alias retained for compatibility with existing source-quality naming in desktop app code.
export function formatSourceQuality(value: string): string {
	return formatDataQuality(value);
}

export interface MapDataQualityRef {
	data_quality?: { tier?: string | null } | null;
	source_quality?: string | null;
}

/**
 * Effective data quality for display and filtering. When the manifest carries
 * a `data_quality` block it fully overrides the legacy self-report — INCLUDING
 * tier "unknown", which renders as Unscored and never falls back. The legacy
 * `source_quality` is used only when the block is entirely absent
 * (pre-backfill manifests/snapshots).
 */
export function resolveEffectiveDataQuality(
	map: MapDataQualityRef,
): string | undefined {
	const tier = map.data_quality?.tier;
	if (tier) return tier;
	return map.source_quality ?? undefined;
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
