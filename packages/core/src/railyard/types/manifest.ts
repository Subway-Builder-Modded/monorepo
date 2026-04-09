import type { AssetType } from '../lib/asset-types';
import type { PerPage, SortState } from '../lib/constants';

export interface AuthorDetails {
  author_id: string;
  author_alias: string;
  attribution_link: string;
  contributor_tier?: string;
}

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
  dependencies?: Record<string, string>;
}

export interface ModManifest {
  schema_version: number;
  id: string;
  name: string;
  author: AuthorDetails;
  github_id: number;
  last_updated: number;
  description: string;
  tags: string[];
  gallery: string[];
  source: string;
  update: unknown;
  is_test?: boolean;
}

export interface MapManifest extends ModManifest {
  city_code: string;
  country: string;
  location: string;
  population: number;
  data_source: string;
  source_quality: string;
  level_of_detail: string;
  special_demand: string[];
  initial_view_state: unknown;
}

export interface AssetQueryFilters {
  query: string;
  type: AssetType;
  perPage: PerPage;
  sort: SortState;
  randomSeed: number;
  mod: {
    tags: string[];
  };
  map: {
    locations: string[];
    sourceQuality: string[];
    levelOfDetail: string[];
    specialDemand: string[];
  };
}
