export const LOCATION_TAGS = [
  'caribbean',
  'central-america',
  'central-asia',
  'east-africa',
  'east-asia',
  'europe',
  'middle-east',
  'north-africa',
  'north-america',
  'oceania',
  'south-america',
  'south-asia',
  'southeast-asia',
  'southern-africa',
  'west-africa',
] as const;

export const DATA_QUALITY_VALUES = [
  'low-quality',
  'medium-quality',
  'high-quality',
] as const;

const DATA_QUALITY_LABELS: Record<string, string> = {
  'low-quality': 'low-data-quality',
  'medium-quality': 'medium-data-quality',
  'high-quality': 'high-data-quality',
};

export function formatDataQuality(value: string): string {
  return DATA_QUALITY_LABELS[value] ?? value;
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
