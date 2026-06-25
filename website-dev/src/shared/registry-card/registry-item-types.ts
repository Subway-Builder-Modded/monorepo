// Canonical types for the registry item card system.
// These live in shared/ so card components can import them without
// depending on any specific feature module.

export type RegistryAssetTypeId = string;

/** Per-type visual and routing configuration. */
export type RegistryTypeConfig = {
  id: RegistryAssetTypeId;
  label: string;
  pluralLabel: string;
  /** URL segment used in /registry/<routeSegment>/<id> */
  routeSegment: string;
  accentLight: string;
  accentDark: string;
};

/** Minimal render-ready data the card component needs. */
export type RegistryCardData = {
  id: string;
  href: string;
  title: string;
  author: string;
  authorId: string | null;
  description: string;
  thumbnailSrc: string | null;
  totalDownloads: number;
  tags: string[];
  /** Map-specific fields – null for non-map types. */
  cityCode: string | null;
  countryCode: string | null;
  countryName: string | null;
  countryEmoji: string | null;
  population: number | null;
};

/** View variant for the card. */
export type RegistryCardVariant = "grid" | "full" | "list";
