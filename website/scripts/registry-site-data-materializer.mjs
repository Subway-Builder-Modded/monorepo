export const REGISTRY_REPO = "Subway-Builder-Modded/registry";
export const REGISTRY_REF = "main";
export const REGISTRY_MAP_DATA_REF = "map-data";
export const REGISTRY_RAW_BASE_URL = `https://raw.githubusercontent.com/${REGISTRY_REPO}`;
export const REGISTRY_MAP_DATA_RAW_BASE_URL = `${REGISTRY_RAW_BASE_URL}/${REGISTRY_MAP_DATA_REF}`;

const ABSOLUTE_OR_ROOT_RELATIVE_URL_PATTERN = /^(?:https?:\/\/|\/)/i;
const PROHIBITED_GENERATED_ASSET_PATTERN =
  /^public\/registry-cache\/(?:maps|mods)\/[^/]+\/gallery\//;
const PROHIBITED_GENERATED_BASEMAP_PATTERN = /^public\/registry-cache\/maps\/[^/]+\/basemap\.svg$/;

export function encodePathSegments(...parts) {
  return parts
    .filter((part) => part.length > 0)
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function splitRelativePath(relativePath) {
  return String(relativePath)
    .split(/[\\/]/)
    .filter((part) => part.length > 0);
}

export function getPinnedRegistryRawUrl(commitSha, routeSegment, id, relativePath) {
  return `${REGISTRY_RAW_BASE_URL}/${encodePathSegments(
    commitSha,
    routeSegment,
    id,
    ...splitRelativePath(relativePath),
  )}`;
}

export function getMapDataBasemapRawUrl(mapId) {
  return `${REGISTRY_MAP_DATA_RAW_BASE_URL}/maps/${encodePathSegments(mapId, "basemap.svg")}`;
}

export function rewriteRegistryGalleryEntries(gallery, { commitSha, routeSegment, id }) {
  if (!Array.isArray(gallery)) {
    return { gallery, rewrittenCount: 0 };
  }

  let rewrittenCount = 0;
  const rewrittenGallery = gallery.map((entry) => {
    if (typeof entry !== "string") {
      return entry;
    }

    const trimmed = entry.trim();
    if (!trimmed || ABSOLUTE_OR_ROOT_RELATIVE_URL_PATTERN.test(trimmed)) {
      return entry;
    }

    rewrittenCount += 1;
    return getPinnedRegistryRawUrl(commitSha, routeSegment, id, trimmed);
  });

  return { gallery: rewrittenGallery, rewrittenCount };
}

export function transformRegistryListingManifest(manifest, options) {
  const { gallery, rewrittenCount } = rewriteRegistryGalleryEntries(manifest?.gallery, options);
  if (gallery === manifest?.gallery) {
    return { manifest, rewrittenCount };
  }
  return {
    manifest: {
      ...manifest,
      gallery,
    },
    rewrittenCount,
  };
}

export function isProhibitedGeneratedRegistryAsset(relativePath) {
  const normalized = String(relativePath).replace(/\\/g, "/");
  return (
    PROHIBITED_GENERATED_ASSET_PATTERN.test(normalized) ||
    PROHIBITED_GENERATED_BASEMAP_PATTERN.test(normalized)
  );
}

export function assertNoProhibitedGeneratedRegistryAssets(relativePaths) {
  for (const relativePath of relativePaths) {
    if (isProhibitedGeneratedRegistryAsset(relativePath)) {
      throw new Error(`prohibited generated registry asset found: ${relativePath}`);
    }
  }
}
