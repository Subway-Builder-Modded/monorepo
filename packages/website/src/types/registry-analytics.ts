import type { ContributorTier } from '@/types/registry';

export type ListingType = 'mod' | 'map';

export type RegistryListingRow = {
  rank: number;
  listing_type: ListingType;
  id: string;
  name: string;
  author: string;
  author_alias?: string;
  attribution_link?: string;
  contributor_tier?: ContributorTier | null;
  total_downloads: number;
};

export type RegistryTrendingRow = {
  rank: number;
  listing_type: ListingType;
  id: string;
  name: string;
  author: string;
  author_alias?: string;
  attribution_link?: string;
  contributor_tier?: ContributorTier | null;
  download_change: number;
  current_total: number;
  baseline_total: number;
};

export type RegistryAuthorRow = {
  rank: number;
  author: string;
  author_alias?: string;
  attribution_link?: string;
  contributor_tier?: ContributorTier | null;
  total_downloads: number;
  asset_count: number;
  map_count: number;
  mod_count: number;
};

export type RegistryProjectRow = {
  rank: number;
  project_key: string;
  project_name: string;
  listing_count: number;
  total_downloads: number;
};

export type RegistryProjectTrendingRow = {
  rank: number;
  project_key: string;
  project_name: string;
  listing_count: number;
  download_change: number;
  current_total: number;
  baseline_total: number;
};

export type RegistryListingProjectRow = {
  listing_type: ListingType;
  id: string;
  name: string;
  project_key: string;
  project_name: string;
};

export type RegistryMapPopulationRow = {
  rank: number;
  id: string;
  name: string;
  author: string;
  author_alias?: string;
  attribution_link?: string;
  contributor_tier?: ContributorTier | null;
  city_code: string;
  country: string;
  population: number;
  population_count: number;
  points_count: number;
};

export type DailyDataPoint = {
  date: string;
  downloads: number;
};

export type RegistryListingDailyRow = {
  listing_type: ListingType;
  id: string;
  dailyData: DailyDataPoint[];
};

export type RegistryAuthorDailyRow = {
  author: string;
  dailyData: DailyDataPoint[];
};

export type RegistryDownloadsByTypeDailyRow = {
  date: string;
  mapDownloads: number;
  modDownloads: number;
  totalDownloads: number;
};

export type RegistryAnalyticsData = {
  allTime: RegistryListingRow[];
  trending1d: RegistryTrendingRow[];
  trending3d: RegistryTrendingRow[];
  trending7d: RegistryTrendingRow[];
  authors: RegistryAuthorRow[];
  projects: RegistryProjectRow[];
  projectsTrending1d: RegistryProjectTrendingRow[];
  projectsTrending3d: RegistryProjectTrendingRow[];
  projectsTrending7d: RegistryProjectTrendingRow[];
  listingProjects: RegistryListingProjectRow[];
  mapPopulations: RegistryMapPopulationRow[];
  downloadsByTypeDaily: RegistryDownloadsByTypeDailyRow[];
  snapshotLabel: string;
  totalDownloads: number;
  totalListings: number;
  totalAuthors: number;
  mapCount: number;
  modCount: number;
  mapDownloads: number;
  modDownloads: number;
};
