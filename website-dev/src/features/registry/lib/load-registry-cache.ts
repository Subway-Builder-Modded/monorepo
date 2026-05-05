import type {
  RawRegistryManifest,
  RawRegistryDownloads,
  RawRegistryIntegrity,
  RegistrySearchItem,
} from "./registry-search-types";

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

async function getLastActivityAt(id: string, integrity: RawRegistryIntegrity): Promise<number> {
  const listing = integrity.listings?.[id];
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

function getTotalDownloads(id: string, downloads: RawRegistryDownloads): number {
  const versions = downloads[id];
  if (!versions) return 0;
  return Object.values(versions).reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);
}

type IntegrityListing = NonNullable<RawRegistryIntegrity["listings"]>[string];
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
  return `/registry/${typeRouteSegment}/${id}/${first}`;
}

function resolveNormalizedTags(typeId: string, manifest: RawRegistryManifest): string[] {
  const tagSet = new Set<string>(Array.isArray(manifest.tags) ? manifest.tags : []);

  if (typeId === "maps") {
    if (manifest.source_quality?.trim()) {
      tagSet.add(manifest.source_quality.trim());
    }
    if (manifest.level_of_detail?.trim()) {
      tagSet.add(manifest.level_of_detail.trim());
    }
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

/** Resolve country name and emoji from a country code. */
async function resolveCountry(code: string): Promise<CountryInfo> {
  try {
    const { default: countryFlagEmoji } = await import("country-flag-emoji");
    const entry = countryFlagEmoji.get(code.toUpperCase());
    if (entry && !Array.isArray(entry) && typeof entry === "object") {
      return { name: entry.name as string, emoji: (entry.emoji as string | null) ?? null };
    }
  } catch {
    // fall through
  }
  return { name: code.toUpperCase(), emoji: null };
}

/** Cached country resolution to avoid re-importing per item. */
const countryCache = new Map<string, Promise<CountryInfo>>();

function getCountryInfo(code: string): Promise<CountryInfo> {
  const upper = code.toUpperCase();
  if (!countryCache.has(upper)) {
    countryCache.set(upper, resolveCountry(upper));
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

export async function loadRegistryItemsForType(
  typeId: string,
  typeRouteSegment: string,
): Promise<RegistrySearchItem[]> {
  const baseUrl = `/registry/${typeRouteSegment}`;

  // Load shared data files in parallel
  const [integrityRaw, downloadsRaw, indexRaw, authorsRaw] = await Promise.all([
    safeFetchText(`${baseUrl}/integrity.json`).catch(() => "{}"),
    safeFetchText(`${baseUrl}/downloads.json`).catch(() => "{}"),
    safeFetchText(`${baseUrl}/index.json`).catch(() => "{}"),
    safeFetchText(`/registry/authors/index.json`).catch(() => "{}"),
  ]);

  const integrity = safeJson<RawRegistryIntegrity>(integrityRaw, {});
  const downloads = safeJson<RawRegistryDownloads>(downloadsRaw, {});
  const authorsIndex = safeJson<RawRegistryAuthorsIndex>(authorsRaw, {});
  const authorAliasMap = buildAuthorAliasMap(authorsIndex);

  // Collect IDs from index.json and integrity.json combined
  const indexData = safeJson<Record<string, string[]>>(indexRaw, {});
  const idsFromIndex: string[] = (indexData[typeRouteSegment] as string[] | undefined) ?? [];
  const idsFromIntegrity = Object.keys(integrity.listings ?? {});

  // Union of both sources; index is primary
  const allIds = idsFromIndex.length > 0 ? idsFromIndex : idsFromIntegrity;
  const eligibleIds = allIds.filter((id) => hasCompleteVersion(integrity.listings?.[id]));

  // Load all manifests in parallel
  const manifestEntries = await Promise.all(
    eligibleIds.map(async (id) => {
      try {
        const raw = await safeFetchText(`${baseUrl}/${id}/manifest.json`);
        return { id, manifest: safeJson<RawRegistryManifest>(raw, {}) };
      } catch {
        return null;
      }
    }),
  );

  // Resolve countries in parallel (cached)
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
    const authorId = manifest.author?.trim() || null;

    const countryCode = manifest.country?.toUpperCase() ?? null;
    let countryName: string | null = null;
    let countryEmoji: string | null = null;

    if (countryCode) {
      const info = await getCountryInfo(countryCode);
      countryName = info.name;
      countryEmoji = info.emoji;
    }

    const lastActivityAt = await getLastActivityAt(id, integrity);

    items.push({
      id,
      type: typeId,
      routeSegment: typeRouteSegment,
      href: `/registry/${typeRouteSegment}/${id}`,
      name: manifest.name?.trim() || id,
      author: resolveAuthorDisplay(manifest.author, authorAliasMap),
      authorId,
      description: manifest.description?.trim() || "",
      tags: resolveNormalizedTags(typeId, manifest),
      thumbnailSrc: resolveThumbnailSrc(typeRouteSegment, id, manifest.gallery),
      totalDownloads: getTotalDownloads(id, downloads),
      lastActivityAt,
      cityCode: typeId === "maps" ? (manifest.city_code ?? null) : null,
      countryCode: typeId === "maps" ? countryCode : null,
      countryName: typeId === "maps" ? countryName : null,
      countryEmoji: typeId === "maps" ? countryEmoji : null,
      population:
        typeId === "maps"
          ? typeof manifest.population === "number"
            ? manifest.population
            : typeof manifest.residents_total === "number"
              ? manifest.residents_total
              : null
          : null,
      isTest: false,
      manifest,
    });
  }

  return items;
}
