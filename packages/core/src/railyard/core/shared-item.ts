/** Shared author data shape for UI components. */
export interface SharedItemAuthor {
  display_name: string;
  contributor_tier?: string | null;
}

/** Shared item data used by ItemCard and related components.
 *  Both apps adapt their native manifest types to this shape. */
export interface SharedItemData {
  id: string;
  name: string;
  author: SharedItemAuthor;
  description?: string | null;
  tags?: string[];
  gallery?: string[];
  source?: string | null;
  // Map-specific
  city_code?: string;
  country?: string;
  location?: string;
  population?: number;
  source_quality?: string;
  level_of_detail?: string;
  special_demand?: string[];
}

/** Shared version info type compatible with both the website registry types
 *  and the Wails-generated Go models. */
export interface SharedVersionInfo {
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
