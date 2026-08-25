import type {
  RawRegistryManifest,
  RawRegistryDownloads,
  RawRegistryIntegrity,
  RegistrySearchItem,
} from "./registry-search-types";
import { normalizeMapCountry } from "@subway-builder-modded/asset-listings-state";
import { LOCATION_TAGS, resolveDataQualityTier } from "@subway-builder-modded/config";
import { getRegistryTypeUiRules } from "@/features/registry/registry-type-ui";
import {
  getRegistryAuthorsIndexPath,
  getRegistryCollectionCachePath,
  getRegistryItemCachePath,
} from "@/features/registry/lib/registry-asset-paths";

const MAP_LOCATION_TAG_SET = new Set<string>([...LOCATION_TAGS, "europe"]);

function safeJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeFetchText(url: string): Promise<string> {
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  });
}

function getUnixSecondsAsMs(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return value * 1000;
}

function getLastActivityAt(
  id: string,
  manifest: RawRegistryManifest,
  integrity: RawRegistryIntegrity,
): number {
  const manifestTimestamp = getUnixSecondsAsMs(manifest.last_updated);
  if (manifestTimestamp > 0) {
    return manifestTimestamp;
  }

  const listing = integrity.listings?.[id];
  const listingTimestamp = getUnixSecondsAsMs(listing?.last_updated);
  if (listingTimestamp > 0) {
    return listingTimestamp;
  }

  if (!listing?.versions) {
    const generated = Date.parse(integrity.generated_at ?? "");
    return Number.isFinite(generated) ? generated : 0;
  }

  let latest = 0;
  for (const v of Object.values(listing.versions)) {
    if (v.is_complete !== true || !v.checked_at) continue;
    const ts = Date.parse(v.checked_at);
    if (Number.isFinite(ts) && ts > latest) latest = ts;
  }

  if (latest > 0) return latest;
  const generated = Date.parse(integrity.generated_at ?? "");
  return Number.isFinite(generated) ? generated : 0;
}

function getCompleteVersionEntries(listing: IntegrityListing | undefined) {
  return Object.entries(listing?.versions ?? {}).filter(
    ([, version]) => version.is_complete === true,
  );
}

/** An availability stamp is only written over a version that once passed integrity. */
function wasEverComplete(version: IntegrityVersion): boolean {
  return version.is_complete === true || version.availability !== undefined;
}

function parseDateTimestamp(value: string | undefined): number {
  const timestamp = Date.parse(value ?? "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getVersionPublishedAt(version: { released_at?: string; checked_at?: string }) {
  return parseDateTimestamp(version.released_at) || parseDateTimestamp(version.checked_at);
}

function getEarliestVersionPublishedAt(versions: Array<[string, IntegrityVersion]>): number | null {
  let earliest = Number.POSITIVE_INFINITY;
  for (const [, version] of versions) {
    const timestamp = getVersionPublishedAt(version);
    if (timestamp > 0 && timestamp < earliest) {
      earliest = timestamp;
    }
  }
  return Number.isFinite(earliest) ? earliest : null;
}

function getPublishedAt(
  manifest: RawRegistryManifest,
  listing: IntegrityListing | undefined,
  fallback: number,
): number {
  const manifestTimestamp = getUnixSecondsAsMs(manifest.first_released);
  if (manifestTimestamp > 0) {
    return manifestTimestamp;
  }

  // A listing debuts when its first downloadable version shipped, so retired and
  // removed versions still count: they were complete once, and dropping them
  // would re-date the listing to whatever release survives and re-debut it.
  const entries = Object.entries(listing?.versions ?? {});
  return (
    getEarliestVersionPublishedAt(entries.filter(([, version]) => wasEverComplete(version))) ??
    getEarliestVersionPublishedAt(entries) ??
    fallback
  );
}

function getLatestVersionInfo(listing: IntegrityListing | undefined, fallbackTimestamp: number) {
  const latestSemverVersion =
    listing?.latest_semver_complete === true ? (listing.latest_semver_version ?? null) : null;
  const completeVersionEntries = getCompleteVersionEntries(listing);
  const latestVersionEntry =
    (latestSemverVersion
      ? completeVersionEntries.find(([version]) => version === latestSemverVersion)
      : null) ??
    completeVersionEntries.reduce<{
      version: string;
      timestamp: number;
    } | null>((latest, [version, versionInfo]) => {
      const timestamp = Date.parse(versionInfo.checked_at ?? "");
      if (!Number.isFinite(timestamp)) {
        return latest;
      }
      if (!latest || timestamp > latest.timestamp) {
        return { version, timestamp };
      }
      return latest;
    }, null);

  if (Array.isArray(latestVersionEntry)) {
    const timestamp = Date.parse(latestVersionEntry[1].checked_at ?? "");
    return {
      latestVersion: latestVersionEntry[0],
      latestVersionUpdatedAt: Number.isFinite(timestamp) ? timestamp : fallbackTimestamp,
    };
  }

  if (latestVersionEntry) {
    return {
      latestVersion: latestVersionEntry.version,
      latestVersionUpdatedAt: latestVersionEntry.timestamp,
    };
  }

  return {
    latestVersion: latestSemverVersion,
    latestVersionUpdatedAt: fallbackTimestamp,
  };
}

function getTotalDownloads(id: string, downloads: RawRegistryDownloads): number {
  const versions = downloads[id];
  if (!versions) return 0;
  return Object.values(versions).reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);
}

type IntegrityListing = NonNullable<RawRegistryIntegrity["listings"]>[string];
type IntegrityVersion = NonNullable<IntegrityListing["versions"]>[string];
type RawRegistryAuthorsIndex = {
  authors?: Array<{
    author_id?: string;
    author_alias?: string;
  }>;
};

function hasCompleteVersion(listing: IntegrityListing | undefined): boolean {
  if (!listing) {
    return false;
  }

  if (listing.has_complete_version === true) {
    return true;
  }

  return Object.values(listing.versions ?? {}).some((version) => version.is_complete === true);
}

function resolveThumbnailSrc(
  typeRouteSegment: string,
  id: string,
  gallery: string[] | undefined,
): string | null {
  const first = gallery?.[0];
  if (!first) return null;
  if (first.startsWith("http://") || first.startsWith("https://") || first.startsWith("/")) {
    return first;
  }
  return getRegistryItemCachePath(typeRouteSegment, id, first);
}

function normalizeStringList(values: string[] | undefined): string[] {
  return Array.isArray(values) ? values.map((value) => value.trim()).filter(Boolean) : [];
}

function resolveNormalizedTags(typeId: string, manifest: RawRegistryManifest): string[] {
  const typeUiRules = getRegistryTypeUiRules(typeId);
  const normalizedManifestTags = normalizeStringList(manifest.tags).filter(
    (tag) => !typeUiRules.hasMapMetadata || !MAP_LOCATION_TAG_SET.has(tag.toLowerCase()),
  );
  const tagSet = new Set<string>(normalizedManifestTags);

  if (typeUiRules.hasMapMetadata) {
    const locationTag = manifest.location?.trim().toLowerCase();
    if (locationTag) {
      tagSet.add(locationTag);
    }

    tagSet.add(resolveDataQualityTier(manifest));
    if (Array.isArray(manifest.special_demand)) {
      for (const demandTag of manifest.special_demand) {
        if (typeof demandTag === "string" && demandTag.trim()) {
          tagSet.add(demandTag.trim());
        }
      }
    }
  }

  return [...tagSet];
}

type CountryInfo = { name: string; emoji: string | null };
type CountryFlagEmojiApi = {
  get: (countryCode: string) => unknown;
};
type CountryFlagEmojiEntry = {
  name: string;
  emoji?: string | null;
};

function getCountryFlagEmojiApi(importedModule: unknown): CountryFlagEmojiApi | null {
  const imported = importedModule as {
    default?: unknown;
    "module.exports"?: unknown;
  };
  const candidate = imported.default ?? imported["module.exports"] ?? importedModule;
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const get = (candidate as { get?: unknown }).get;
  if (typeof get !== "function") {
    return null;
  }

  return candidate as CountryFlagEmojiApi;
}

function isCountryFlagEmojiEntry(value: unknown): value is CountryFlagEmojiEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.name === "string";
}

class CountryResolutionUnavailableError extends Error {
  readonly fallback: CountryInfo;

  constructor(code: string) {
    super(`country-flag-emoji unavailable for ${code}`);
    this.name = "CountryResolutionUnavailableError";
    this.fallback = { name: code.toUpperCase(), emoji: null };
  }
}

/** Resolve country name and emoji from a country code. */
async function resolveCountry(code: string): Promise<CountryInfo> {
  let api: CountryFlagEmojiApi | null = null;
  try {
    const imported = await import("country-flag-emoji");
    api = getCountryFlagEmojiApi(imported);
  } catch {
    api = null;
  }

  if (!api) {
    // Transient failure (dynamic-import hiccup): fall back for this call but
    // signal the caller not to memoize it — a cached code-as-name fallback
    // pinned "SK" as Slovakia's display name for a whole server lifetime the
    // first time a brand-new country appeared (2026-08).
    throw new CountryResolutionUnavailableError(code);
  }

  const entry = api.get(code.toUpperCase());
  if (isCountryFlagEmojiEntry(entry)) {
    return { name: entry.name, emoji: entry.emoji ?? null };
  }

  // Genuinely unknown code: the fallback is correct and safe to memoize.
  return { name: code.toUpperCase(), emoji: null };
}

const countryCache = new Map<string, Promise<CountryInfo>>();

function getCountryInfo(code: string): Promise<CountryInfo> {
  const upper = code.toUpperCase();
  if (!countryCache.has(upper)) {
    // Memoize successful resolutions only: on a transient failure, serve the
    // fallback for this call and evict, so the next call retries the import.
    countryCache.set(
      upper,
      resolveCountry(upper).catch((error: unknown) => {
        countryCache.delete(upper);
        if (error instanceof CountryResolutionUnavailableError) {
          return error.fallback;
        }
        return { name: upper, emoji: null };
      }),
    );
  }
  return countryCache.get(upper)!;
}

function buildAuthorAliasMap(authorsIndex: RawRegistryAuthorsIndex): Map<string, string> {
  const result = new Map<string, string>();
  for (const author of authorsIndex.authors ?? []) {
    const authorId = author.author_id?.trim();
    const authorAlias = author.author_alias?.trim();
    if (!authorId || !authorAlias) continue;
    result.set(authorId.toLowerCase(), authorAlias);
  }
  return result;
}

function resolveAuthorDisplay(
  manifestAuthor: string | undefined,
  authorAliasMap: Map<string, string>,
): string {
  const authorId = manifestAuthor?.trim();
  if (!authorId) return "Unknown creator";
  return authorAliasMap.get(authorId.toLowerCase()) ?? authorId;
}

function extractGithubRepoSlugFromPathParts(parts: string[]): string | null {
  const owner = parts[0]?.trim();
  const repo = parts[1]?.replace(/\.git$/i, "").trim();
  if (!owner || !repo) {
    return null;
  }
  return `${owner}/${repo}`;
}

function extractGithubRepoSlugFromUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname.endsWith(".github.io")) {
      const owner = hostname.slice(0, -".github.io".length);
      const repo = parsed.pathname
        .split("/")
        .filter(Boolean)[0]
        ?.replace(/\.git$/i, "")
        .trim();
      return owner && repo ? `${owner}/${repo}` : null;
    }

    if (
      hostname !== "github.com" &&
      hostname !== "www.github.com" &&
      hostname !== "raw.githubusercontent.com"
    ) {
      return null;
    }
    return extractGithubRepoSlugFromPathParts(parsed.pathname.split("/").filter(Boolean));
  } catch {
    const matched = trimmed.match(
      /(?:github\.com|raw\.githubusercontent\.com)\/([^/?#]+)\/([^/?#]+)/i,
    );
    if (!matched) {
      return null;
    }
    return extractGithubRepoSlugFromPathParts([matched[1] ?? "", matched[2] ?? ""]);
  }
}

export async function loadRegistryItemsForType(
  typeId: string,
  typeRouteSegment: string,
): Promise<RegistrySearchItem[]> {
  const typeUiRules = getRegistryTypeUiRules(typeId);
  const baseUrl = getRegistryCollectionCachePath(typeRouteSegment);

  // Load shared data files in parallel
  const [integrityRaw, downloadsRaw, indexRaw, authorsRaw] = await Promise.all([
    safeFetchText(`${baseUrl}/integrity.json`).catch(() => "{}"),
    safeFetchText(`${baseUrl}/downloads.json`).catch(() => "{}"),
    safeFetchText(`${baseUrl}/index.json`).catch(() => "{}"),
    safeFetchText(getRegistryAuthorsIndexPath()).catch(() => "{}"),
  ]);

  const integrity = safeJson<RawRegistryIntegrity>(integrityRaw, {});
  const downloads = safeJson<RawRegistryDownloads>(downloadsRaw, {});
  const authorsIndex = safeJson<RawRegistryAuthorsIndex>(authorsRaw, {});
  const authorAliasMap = buildAuthorAliasMap(authorsIndex);

  // Collect IDs from index.json and integrity.json combined
  const indexData = safeJson<Record<string, string[]>>(indexRaw, {});
  const idsFromIndex: string[] = (indexData[typeRouteSegment] as string[] | undefined) ?? [];
  const idsFromIntegrity = Object.keys(integrity.listings ?? {});

  const allIds = idsFromIndex.length > 0 ? idsFromIndex : idsFromIntegrity;

  // Load all manifests in parallel. Eligibility is decided per item below:
  // a listing qualifies when it has an integrity-complete version OR is
  // author-deprecated (the registry pipeline reports deprecated listings with
  // zero complete versions, but they must stay visible for attribution and
  // behind the browse Visibility → Deprecated toggle).
  const manifestEntries = await Promise.all(
    allIds.map(async (id) => {
      try {
        const raw = await safeFetchText(
          getRegistryItemCachePath(typeRouteSegment, id, "manifest.json"),
        );
        return { id, manifest: safeJson<RawRegistryManifest>(raw, {}) };
      } catch {
        return null;
      }
    }),
  );

  const validEntries = manifestEntries.filter(
    (e): e is { id: string; manifest: RawRegistryManifest } => e !== null,
  );

  const countryCodes = new Set<string>();
  for (const { manifest } of validEntries) {
    if (manifest.country) countryCodes.add(manifest.country.toUpperCase());
  }
  await Promise.all([...countryCodes].map((code) => getCountryInfo(code)));

  const items: RegistrySearchItem[] = [];

  for (const { id, manifest } of validEntries) {
    if (manifest.is_test === true) continue;
    const isDeprecated = manifest.deprecation !== undefined;
    const isDeleted = manifest.deprecation?.deleted === true;
    if (!isDeprecated && !hasCompleteVersion(integrity.listings?.[id])) continue;
    const authorId = manifest.author?.trim() || null;

    const normalizedCountryCode = normalizeMapCountry(manifest.country);
    const countryCode = normalizedCountryCode || null;
    let countryName: string | null = null;
    let countryEmoji: string | null = null;

    if (countryCode) {
      const info = await getCountryInfo(countryCode);
      countryName = info.name;
      countryEmoji = info.emoji;
    }

    const lastActivityAt = getLastActivityAt(id, manifest, integrity);
    const listing = integrity.listings?.[id];
    const { latestVersion, latestVersionUpdatedAt } = getLatestVersionInfo(listing, lastActivityAt);

    items.push({
      id,
      type: typeId,
      routeSegment: typeRouteSegment,
      href: `/registry/${typeRouteSegment}/${id}`,
      projectId: extractGithubRepoSlugFromUrl(manifest.source),
      name: manifest.name?.trim() || id,
      author: resolveAuthorDisplay(manifest.author, authorAliasMap),
      authorId,
      description: manifest.description?.trim() || "",
      tags: resolveNormalizedTags(typeId, manifest),
      searchAliases: normalizeStringList(manifest.search_aliases),
      thumbnailSrc: resolveThumbnailSrc(typeRouteSegment, id, manifest.gallery),
      totalDownloads: getTotalDownloads(id, downloads),
      lastActivityAt,
      publishedAt: getPublishedAt(manifest, listing, lastActivityAt),
      latestVersion,
      latestVersionUpdatedAt,
      cityCode: typeUiRules.hasMapMetadata ? (manifest.city_code ?? null) : null,
      countryCode: typeUiRules.hasMapMetadata ? countryCode : null,
      countryName: typeUiRules.hasMapMetadata ? countryName : null,
      countryEmoji: typeUiRules.hasMapMetadata ? countryEmoji : null,
      population: typeUiRules.hasMapMetadata
        ? typeof manifest.population === "number"
          ? manifest.population
          : typeof manifest.residents_total === "number"
            ? manifest.residents_total
            : null
        : null,
      dataQualityScore:
        typeUiRules.hasMapMetadata && typeof manifest.data_quality?.weighted_score === "number"
          ? manifest.data_quality.weighted_score
          : null,
      isTest: false,
      isDeprecated,
      isDeleted,
      manifest,
    });
  }

  return items;
}
