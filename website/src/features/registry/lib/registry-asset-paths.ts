export const REGISTRY_CACHE_PUBLIC_BASE = "/registry-cache";
export const REGISTRY_RAW_GITHUB_BASE =
  "https://raw.githubusercontent.com/Subway-Builder-Modded/registry";
export const REGISTRY_MAP_DATA_RAW_BASE = `${REGISTRY_RAW_GITHUB_BASE}/map-data`;

function encodePathSegments(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export function getRegistryCollectionCachePath(routeSegment: string): string {
  return `${REGISTRY_CACHE_PUBLIC_BASE}/${routeSegment}`;
}

export function getRegistryItemCachePath(
  routeSegment: string,
  id: string,
  relativePath?: string,
): string {
  const basePath = `${getRegistryCollectionCachePath(routeSegment)}/${encodeURIComponent(id)}`;
  if (!relativePath) {
    return basePath;
  }

  const normalizedRelativePath = relativePath.replace(/^\/+/, "");
  return `${basePath}/${normalizedRelativePath}`;
}

export function getRegistryAuthorsIndexPath(): string {
  return `${REGISTRY_CACHE_PUBLIC_BASE}/authors/index.json`;
}

export function getRegistryCreditsCachePath(fileName: string): string {
  return `${REGISTRY_CACHE_PUBLIC_BASE}/credits/${fileName}`;
}

export function getRegistryMapBasemapUrl(mapId: string): string {
  return `${REGISTRY_MAP_DATA_RAW_BASE}/maps/${encodePathSegments(mapId, "basemap.svg")}`;
}
