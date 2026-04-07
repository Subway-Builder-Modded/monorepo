interface ModListingMatches {
  tags?: string[] | null;
}

interface MapListingMatches {
  location?: string | null;
  source_quality?: string | null;
  level_of_detail?: string | null;
  special_demand?: string[] | null;
}

export interface AssetListingCounts {
  modTagCounts: Record<string, number>;
  mapLocationCounts: Record<string, number>;
  mapDataQualityCounts: Record<string, number>;
  mapLevelOfDetailCounts: Record<string, number>;
  mapSpecialDemandCounts: Record<string, number>;
}

function incrementCount(target: Record<string, number>, value?: string | null) {
  if (!value) return;
  target[value] = (target[value] ?? 0) + 1;
}

interface BuildListingCountsArgs {
  valuesByItem: readonly (readonly (string | null | undefined)[])[];
  dedupePerItem?: boolean;
}

export function buildListingCounts({
  valuesByItem,
  dedupePerItem = true,
}: BuildListingCountsArgs): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const rawValues of valuesByItem) {
    const normalizedValues = dedupePerItem
      ? [...new Set(rawValues)]
      : rawValues;
    for (const value of normalizedValues) {
      incrementCount(counts, value);
    }
  }

  return counts;
}

export function buildAssetListingCounts(
  mods: readonly ModListingMatches[],
  maps: readonly MapListingMatches[],
): AssetListingCounts {
  const modTagCounts = buildListingCounts({
    valuesByItem: mods.map((item) => item.tags ?? []),
  });
  const mapLocationCounts = buildListingCounts({
    valuesByItem: maps.map((item) => [item.location]),
    dedupePerItem: false,
  });
  const mapDataQualityCounts = buildListingCounts({
    valuesByItem: maps.map((item) => [item.source_quality]),
    dedupePerItem: false,
  });
  const mapLevelOfDetailCounts = buildListingCounts({
    valuesByItem: maps.map((item) => [item.level_of_detail]),
    dedupePerItem: false,
  });
  const mapSpecialDemandCounts = buildListingCounts({
    valuesByItem: maps.map((item) => item.special_demand ?? []),
  });

  return {
    modTagCounts,
    mapLocationCounts,
    mapDataQualityCounts,
    mapLevelOfDetailCounts,
    mapSpecialDemandCounts,
  };
}

export function filterVisibleListingValues(
  values: readonly string[],
  counts: Record<string, number>,
  selected: readonly string[],
): string[] {
  return values.filter(
    (value) => selected.includes(value) || (counts[value] ?? 0) > 0,
  );
}
