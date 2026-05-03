/** Sort option identifiers for the registry browse UI. */
export type RegistrySortId =
  | "lastUpdated"
  | "downloads"
  | "population"
  | "name"
  | "cityCode"
  | "country"
  | "author"
  | "random";

/** View mode for the registry browse grid. */
export type RegistryViewMode = "grid" | "list";

/** Defines a single sort option. */
export type RegistrySortOption = {
  id: RegistrySortId;
  label: string;
  /** "all" means supported by every type. Otherwise list of supported type ids. */
  supportedTypes: "all" | string[];
  /** Whether asc/desc direction is meaningful for this sort. */
  supportsDirection: boolean;
};

/** All available sort options for the registry browser. */
export const REGISTRY_SORT_OPTIONS: RegistrySortOption[] = [
  { id: "lastUpdated", label: "Last Updated", supportedTypes: "all", supportsDirection: true },
  { id: "downloads", label: "Downloads", supportedTypes: "all", supportsDirection: true },
  { id: "name", label: "Name", supportedTypes: "all", supportsDirection: true },
  { id: "author", label: "Author", supportedTypes: "all", supportsDirection: true },
  { id: "population", label: "Population", supportedTypes: ["maps"], supportsDirection: true },
  { id: "cityCode", label: "City Code", supportedTypes: ["maps"], supportsDirection: true },
  { id: "country", label: "Country", supportedTypes: ["maps"], supportsDirection: true },
  { id: "random", label: "Random", supportedTypes: "all", supportsDirection: false },
];

/** Returns true if a sort option is supported for the given type id. */
export function isSortSupportedForType(sort: RegistrySortOption, typeId: string): boolean {
  if (sort.supportedTypes === "all") return true;
  return sort.supportedTypes.includes(typeId);
}

/** Returns the fallback sort id when the active sort is not valid for the new type. */
export const FALLBACK_SORT_ID: RegistrySortId = "lastUpdated";

/** The default sort and direction. */
export const DEFAULT_SORT_ID: RegistrySortId = "lastUpdated";
export const DEFAULT_SORT_DIR: "asc" | "desc" = "desc";
export const DEFAULT_VIEW_MODE: RegistryViewMode = "grid";
