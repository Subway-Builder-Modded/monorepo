import type { RegistryTypeConfig } from "@/shared/registry-card/registry-item-types";

export type RegistryDetailSourceLink = {
  label: string;
  href: string;
};

export type RegistryDetailVersion = {
  version: string;
  releaseDate: string | null;
  downloads: number | null;
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

export type RegistryDetailMapFields = {
  cityCode: string | null;
  countryCode: string | null;
  country: string | null;
  population: number | null;
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
  authorHref: string | null;
  sourceCodeLink: RegistryDetailSourceLink | null;
  tags: string[];
  downloads: number | null;
  galleryImages: string[];
  versions: RegistryDetailVersion[];
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
    update?: {
      type?: string;
      repo?: string;
      url?: string;
    };
  };
  listingLatestSemverVersion: string | null;
  listingLatestSemverComplete: boolean;
  listingCompleteVersions: string[];
  listingVersions: Record<string, RegistryDetailIntegrityVersion>;
  versionDownloads: Record<string, number>;
  authorAttributionHref: string | null;
};
