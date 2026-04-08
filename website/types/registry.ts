export interface UpdateConfig {
  type?: string;
  repo?: string;
  url?: string;
}

export type ContributorTier =
  | 'developer'
  | 'engineer'
  | 'conductor'
  | 'executive';

export interface RegistryAuthorsIndexEntry {
  github_id?: number;
  author_id: string;
  author_alias?: string;
  attribution_link?: string;
  contributor_tier?: string;
}

export interface RegistryAuthorsIndex {
  schema_version?: number;
  authors: RegistryAuthorsIndexEntry[];
}

export interface ModManifest {
  schema_version?: number;
  id: string;
  name: string;
  author: string;
  author_alias?: string;
  attribution_link?: string;
  contributor_tier?: ContributorTier | null;
  github_id?: number;
  last_updated?: number;
  description: string;
  tags?: string[];
  gallery?: string[];
  source?: string;
  update?: UpdateConfig;
  is_test?: boolean;
}

export interface MapManifest extends ModManifest {
  initial_view_state?: {
    latitude: number;
    longitude: number;
    zoom: number;
    bearing: number;
    pitch?: number | null;
  };
  initialViewState?: {
    latitude: number;
    longitude: number;
    zoom: number;
    bearing: number;
    pitch?: number | null;
  };
  city_code?: string;
  country?: string;
  location?: string;
  population?: number;
  data_source?: string;
  source_quality?: string;
  level_of_detail?: string;
  special_demand?: string[];
}

export type RegistryItemType = 'mods' | 'maps';
export type AssetType = 'mod' | 'map';

export type TaggedItem =
  | { type: 'mod'; item: ModManifest }
  | { type: 'map'; item: MapManifest };

export interface IntegrityVersionStatus {
  complete?: boolean;
  missing_keys?: string[];
  empty_keys?: string[];
}

export interface IntegrityListing {
  has_complete_version: boolean;
  latest_semver_version?: string;
  latest_semver_complete?: boolean;
  complete_versions: string[];
  incomplete_versions: string[];
  versions?: Record<string, IntegrityVersionStatus>;
}

export interface RegistryIntegrityReport {
  schema_version?: number;
  generated_at?: string;
  listings: Record<string, IntegrityListing>;
}

export type DownloadCounts = Record<string, number>;
export type AssetDownloadCountsByVersion = Record<string, DownloadCounts>;

export interface VersionInfo {
  version: string;
  name: string;
  changelog: string;
  date: string;
  download_url: string;
  game_version: string;
  sha256: string;
  downloads: number;
  manifest?: string;
  prerelease: boolean;
}
