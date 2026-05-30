import type { RegistryTypeConfig } from "@/shared/registry-card/registry-item-types";

/** Registry asset type configurations.
 * Add new asset types here to extend the registry.
 */
export const REGISTRY_TYPES: RegistryTypeConfig[] = [
  {
    id: "maps",
    label: "Map",
    pluralLabel: "Maps",
    routeSegment: "maps",
    accentLight: "#2563eb",
    accentDark: "#60a5fa",
  },
  {
    id: "mods",
    label: "Mod",
    pluralLabel: "Mods",
    routeSegment: "mods",
    accentLight: "#dc2626",
    accentDark: "#f87171",
  },
];

/** Map from type id to config for O(1) lookup. */
export const REGISTRY_TYPE_MAP = new Map(REGISTRY_TYPES.map((t) => [t.id, t]));

/** Returns the type config for a given id, or undefined if not found. */
export function getRegistryTypeConfig(typeId: string): RegistryTypeConfig | undefined {
  return REGISTRY_TYPE_MAP.get(typeId);
}

/** Returns the type config for a given id, falling back to a generic config. */
export function getRegistryTypeConfigOrDefault(typeId: string): RegistryTypeConfig {
  return (
    REGISTRY_TYPE_MAP.get(typeId) ?? {
      id: typeId,
      label: typeId,
      pluralLabel: `${typeId}s`,
      routeSegment: typeId,
      accentLight: "#6b7280",
      accentDark: "#9ca3af",
    }
  );
}

/** The default active type id used when none is specified. */
export const DEFAULT_REGISTRY_TYPE_ID = "maps";
