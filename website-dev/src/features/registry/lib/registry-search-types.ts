import type { RegistryAssetTypeId } from "@/shared/registry-card/registry-item-types";

/** Full normalized registry item used by the registry browse UI. */
export type RegistrySearchItem = {
  id: string;
  type: RegistryAssetTypeId;
  /** URL segment for the type, e.g. "maps" or "mods". */
  routeSegment: string;
  /** Resolved canonical href, e.g. /registry/maps/gwangju-4 */
  href: string;
  name: string;
  author: string;
  description: string;
  tags: string[];
  thumbnailSrc: string | null;
  totalDownloads: number;
  /** Unix timestamp in milliseconds, 0 if unknown. */
  lastActivityAt: number;
  cityCode: string | null;
  countryCode: string | null;
  countryName: string | null;
  countryEmoji: string | null;
  population: number | null;
  isTest: boolean;
  /** Raw manifest for advanced consumers; do not depend on shape. */
  manifest: unknown;
};

/** Raw manifest from cached JSON files. */
export type RawRegistryManifest = {
  id?: string;
  name?: string;
  author?: string;
  description?: string;
  gallery?: string[];
  tags?: string[];
  source_quality?: string;
  level_of_detail?: string;
  special_demand?: string[];
  city_code?: string;
  country?: string;
  population?: number;
  residents_total?: number;
  is_test?: boolean;
};

/** Shape of the index.json file in each type folder. */
export type RawRegistryIndex = {
  schema_version?: number;
  maps?: string[];
  mods?: string[];
};

/** Shape of the downloads.json file. */
export type RawRegistryDownloads = Record<string, Record<string, number>>;

/** Shape of the integrity.json file. */
export type RawRegistryIntegrity = {
  generated_at?: string;
  listings?: Record<
    string,
    {
      has_complete_version?: boolean;
      versions?: Record<
        string,
        {
          is_complete?: boolean;
          checked_at?: string;
        }
      >;
    }
  >;
};
