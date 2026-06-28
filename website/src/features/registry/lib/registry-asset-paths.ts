export const REGISTRY_CACHE_PUBLIC_BASE = "/registry-cache";

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
