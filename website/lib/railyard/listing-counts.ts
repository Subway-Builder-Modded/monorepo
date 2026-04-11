import {
  buildAssetListingCounts as buildSharedAssetListingCounts,
  buildListingCounts,
  filterVisibleListingValues,
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

export { buildListingCounts, filterVisibleListingValues };

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
