import {
  buildAssetListingCounts as buildSharedAssetListingCounts,
  buildListingCounts as sharedBuildListingCounts,
  filterVisibleListingValues as sharedFilterVisibleListingValues,
} from '@subway-builder-modded/config';

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

export function buildListingCounts(
  args: Parameters<typeof sharedBuildListingCounts>[0],
): Record<string, number> {
  return sharedBuildListingCounts(args);
}

export function filterVisibleListingValues(
  values: readonly string[],
  counts: Record<string, number>,
  selected: readonly string[],
): string[] {
  return sharedFilterVisibleListingValues(values, counts, selected);
}

export function buildAssetListingCounts(
  mods: readonly ModListingMatches[],
  maps: readonly MapListingMatches[],
): AssetListingCounts {
  const {
    modTagCounts,
    mapLocationCounts,
    mapSourceQualityCounts,
    mapLevelOfDetailCounts,
    mapSpecialDemandCounts,
  } = buildSharedAssetListingCounts(mods, maps);

  return {
    modTagCounts,
    mapLocationCounts,
    mapDataQualityCounts: mapSourceQualityCounts,
    mapLevelOfDetailCounts,
    mapSpecialDemandCounts,
  };
}
