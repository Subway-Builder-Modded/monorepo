import type { RegistryTypeConfig } from "@/shared/registry-card/registry-item-types";

export type RegistryDetailSourceLink = {
  label: string;
  href: string;
};

export type RegistryDetailCollaborator = {
  authorId: string;
  authorLabel: string;
  /** True when this collaborator is the listing's active caretaker (caretakers entry without `until`). */
  isActiveCaretaker: boolean;
};

export type RegistryDetailDataQuality =
  | "Very High"
  | "High"
  | "Medium"
  | "Low"
  | "Very Low"
  | "Absent"
  | "Unknown";

export type RegistryDetailVersion = {
  version: string;
  releaseDate: string | null;
  downloads: number | null;
  downloadUrl: string | null;
  sourceRepo: string | null;
  sourceTag: string | null;
};

export type RegistryDetailIntegritySource = {
  update_type?: string;
  repo?: string;
  tag?: string;
  asset_name?: string;
  download_url?: string;
};

export type RegistryDetailIntegrityVersion = {
  is_complete?: boolean;
  checked_at?: string;
  source?: RegistryDetailIntegritySource;
};

export type RegistryDetailDownloadAnalytics = {
  rank: number | null;
  allTime: number | null;
  last14Days: number | null;
  last7Days: number | null;
};

export type RegistryDetailDownloadHistoryPoint = {
  date: string;
  downloads: number;
};

/** One release version's daily download series (registry version-grain CSV). */
export type RegistryDetailVersionDailySeries = {
  version: string;
  totalDownloads: number;
  history: RegistryDetailDownloadHistoryPoint[];
};

export type RegistryDetailDownloadTrend = {
  period: "1d" | "3d" | "7d" | "14d";
  label: string;
  downloads: number | null;
  rank: number | null;
};

export type RegistryDetailMapFields = {
  rankings: {
    population: number | null;
    populationCount: number | null;
    pointsCount: number | null;
    playableAreaKm2: number | null;
  };
  cityCode: string | null;
  countryCode: string | null;
  country: string | null;
  population: number | null;
  populationCount: number | null;
  pointsCount: number | null;
  playableAreaKm2: number | null;
  dataQuality: RegistryDetailDataQuality | null;
  /** Weighted data-quality composite in [0, 1]; null when the map is unscored. */
  weightedScore: number | null;
  fileSizes: {
    pmtiles: number | null;
    buildingsIndexJson: number | null;
    buildingsIndexBin: number | null;
    demandData: number | null;
    oceanDepthIndex: number | null;
    roads: number | null;
    runwaysTaxiways: number | null;
    other: number | null;
  };
};

export type RegistryDetailModel = {
  id: string;
  typeId: string;
  routeSegment: string;
  typeConfig: RegistryTypeConfig;
  name: string;
  description: string;
  excerpt: string | null;
  authorLabel: string;
  authorId: string | null;
  authorHref: string | null;
  collaborators: RegistryDetailCollaborator[];
  sourceCodeLink: RegistryDetailSourceLink | null;
  projectId: string | null;
  tags: string[];
  downloads: number | null;
  downloadAnalytics: RegistryDetailDownloadAnalytics;
  downloadHistory: RegistryDetailDownloadHistoryPoint[];
  versionDownloadHistory: RegistryDetailVersionDailySeries[];
  downloadTrends: RegistryDetailDownloadTrend[];
  galleryImages: string[];
  versions: RegistryDetailVersion[];
  versionSource: {
    updateType: string | null;
    updateUrl: string | null;
  } | null;
  latestVersion: string | null;
  latestDownloadUrl: string | null;
  publishedDate: string | null;
  updatedDate: string | null;
  integrityVersionCount: number;
  mapFields: RegistryDetailMapFields | null;
  /** Author-deprecation record; null for active listings. Deprecated listings
   * render a notice and never offer downloads. */
  deprecation: {
    since: string | null;
    reason: string | null;
  } | null;
};

export type RegistryDetailLoadedData = {
  typeConfig: RegistryTypeConfig;
  item: {
    id: string;
    type: string;
    routeSegment: string;
    name: string;
    author: string;
    authorId: string | null;
    description: string;
    tags: string[];
    thumbnailSrc: string | null;
    totalDownloads: number;
    cityCode: string | null;
    countryCode: string | null;
    countryName: string | null;
    population: number | null;
  };
  manifest: {
    name?: string;
    description?: string;
    tags?: string[];
    gallery?: string[];
    source?: string;
    source_quality?: string;
    data_quality?: {
      tier?: string;
      raw_score?: number;
      weighted_score?: number;
      rubric_version?: number;
      provenance?: string;
    };
    population_count?: number;
    points_count?: number;
    grid_statistics?: {
      detail?: {
        playableAreaKm2?: number;
      };
    };
    file_sizes?: Record<string, number>;
    last_updated?: number;
    update?: {
      type?: string;
      repo?: string;
      url?: string;
    };
    deprecation?: {
      since?: string;
      by_github_id?: number;
      reason?: string;
    };
  };
  listingLastUpdated: number | null;
  listingLatestSemverVersion: string | null;
  listingLatestSemverComplete: boolean;
  listingCompleteVersions: string[];
  listingVersions: Record<string, RegistryDetailIntegrityVersion>;
  versionReleaseDates: Record<string, string>;
  versionDownloads: Record<string, number>;
  authorAttributionHref: string | null;
  collaborators?: RegistryDetailCollaborator[];
  projectId: string | null;
  downloadAnalytics: RegistryDetailDownloadAnalytics;
  downloadHistory?: RegistryDetailDownloadHistoryPoint[];
  versionDownloadHistory?: RegistryDetailVersionDailySeries[];
  downloadTrends?: RegistryDetailDownloadTrend[];
  mapRankings: {
    population: number | null;
    populationCount: number | null;
    pointsCount: number | null;
    playableAreaKm2: number | null;
  } | null;
};
