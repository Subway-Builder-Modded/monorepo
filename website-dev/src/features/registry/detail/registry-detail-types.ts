import type { RegistryTypeConfig } from "@/shared/registry-card/registry-item-types";

export type RegistryDetailSourceLink = {
  label: string;
  href: string;
};

export type RegistryDetailCollaborator = {
  authorId: string;
  authorLabel: string;
};

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

export type RegistryDetailDownloadTrend = {
  period: "1d" | "3d" | "7d";
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
  sourceQuality: "High" | "Medium" | "Low" | null;
  levelOfDetail: "High" | "Medium" | "Low" | null;
  fileSizes: {
    pmtiles: number | null;
    buildingsIndex: number | null;
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
    level_of_detail?: string;
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
  downloadTrends?: RegistryDetailDownloadTrend[];
  mapRankings: {
    population: number | null;
    populationCount: number | null;
    pointsCount: number | null;
    playableAreaKm2: number | null;
  } | null;
};
