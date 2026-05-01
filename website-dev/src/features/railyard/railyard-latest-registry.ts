import countryFlagEmoji from "country-flag-emoji";
import type { RegistryItemBase } from "@/features/registry/lib/registry-types";

export type RailyardRegistryAssetKind = "map" | "mod";

type RegistryManifest = {
  id?: string;
  name?: string;
  author?: string;
  description?: string;
  gallery?: string[];
  city_code?: string;
  country?: string;
  population?: number;
  residents_total?: number;
  is_test?: boolean;
};

type RegistryDownloads = Record<string, Record<string, number>>;

type IntegrityVersion = {
  is_complete?: boolean;
  checked_at?: string;
};

type IntegrityListing = {
  has_complete_version?: boolean;
  versions?: Record<string, IntegrityVersion>;
};

type RegistryIntegrity = {
  generated_at?: string;
  listings?: Record<string, IntegrityListing>;
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

export type RailyardLatestRegistryItem = RegistryItemBase & {
  lastActivityAt: number;
};

function safeParseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getTotalDownloads(downloads: RegistryDownloads, id: string): number {
  const versions = downloads[id];
  if (!versions) {
    return 0;
  }

  return Object.values(versions).reduce(
    (sum, value) => sum + (Number.isFinite(value) ? value : 0),
    0,
  );
}

function getLastActivityTimestamp(integrity: RegistryIntegrity, id: string): number {
  const listing = integrity.listings?.[id];
  if (!listing?.versions) {
    const generated = Date.parse(integrity.generated_at ?? "");
    return Number.isFinite(generated) ? generated : 0;
  }

  let latest = 0;
  for (const version of Object.values(listing.versions)) {
    if (version.is_complete !== true || !version.checked_at) {
      continue;
    }

    const checkedAt = Date.parse(version.checked_at);
    if (Number.isFinite(checkedAt) && checkedAt > latest) {
      latest = checkedAt;
    }
  }

  if (latest > 0) {
    return latest;
  }

  const generated = Date.parse(integrity.generated_at ?? "");
  return Number.isFinite(generated) ? generated : 0;
}

function resolveThumbnailSrc(
  kind: RailyardRegistryAssetKind,
  id: string,
  gallery: string[] | undefined,
): string | null {
  const firstGallery = gallery?.[0];
  if (!firstGallery) {
    return null;
  }

  if (
    firstGallery.startsWith("http://") ||
    firstGallery.startsWith("https://") ||
    firstGallery.startsWith("/")
  ) {
    return firstGallery;
  }

  const kindFolder = kind === "map" ? "maps" : "mods";
  return `/registry/${kindFolder}/${id}/${firstGallery}`;
}

function toLatestItem(
  kind: RailyardRegistryAssetKind,
  id: string,
  manifest: RegistryManifest,
  downloads: RegistryDownloads,
  integrity: RegistryIntegrity,
): RailyardLatestRegistryItem {
  const countryCode = manifest.country?.toUpperCase() ?? null;
  const country = countryCode ? countryFlagEmoji.get(countryCode) : undefined;
  const countryEntry =
    country && !Array.isArray(country) && typeof country === "object" ? country : undefined;

  return {
    id,
    kind,
    href: `/registry/${kind === "map" ? "maps" : "mods"}/${id}`,
    title: manifest.name?.trim() || id,
    author: manifest.author?.trim() || "Unknown creator",
    description: manifest.description?.trim() || "No description provided.",
    thumbnailSrc: resolveThumbnailSrc(kind, id, manifest.gallery),
    totalDownloads: getTotalDownloads(downloads, id),
    lastActivityAt: getLastActivityTimestamp(integrity, id),
    cityCode: kind === "map" ? (manifest.city_code ?? null) : null,
    countryCode: kind === "map" ? countryCode : null,
    countryName: kind === "map" ? (countryEntry?.name ?? countryCode) : null,
    countryEmoji: kind === "map" ? (countryEntry?.emoji ?? null) : null,
    population:
      kind === "map"
        ? typeof manifest.population === "number"
          ? manifest.population
          : typeof manifest.residents_total === "number"
            ? manifest.residents_total
            : null
        : null,
  };
}

async function fetchAndBuildItemsForKind(
  kind: RailyardRegistryAssetKind,
  kindPath: "maps" | "mods",
): Promise<RailyardLatestRegistryItem[]> {
  const [integrityRaw, downloadsRaw] = await Promise.all([
    fetch(`/registry/${kindPath}/integrity.json`).then((r) => r.text()),
    fetch(`/registry/${kindPath}/downloads.json`).then((r) => r.text()),
  ]);

  const integrity = safeParseJson<RegistryIntegrity>(integrityRaw, {});
  const downloads = safeParseJson<RegistryDownloads>(downloadsRaw, {});

  const candidates = Object.entries(integrity.listings ?? {})
    .filter(([, listing]) => hasCompleteVersion(listing))
    .map(([id]) => ({ id, lastActivityAt: getLastActivityTimestamp(integrity, id) }))
    .sort((a, b) => b.lastActivityAt - a.lastActivityAt);

  const items: RailyardLatestRegistryItem[] = [];

  for (const { id } of candidates) {
    const raw = await fetch(`/registry/${kindPath}/${id}/manifest.json`).then((r) => r.text());
    const manifest = safeParseJson<RegistryManifest>(raw, {});

    if (manifest.is_test === true) {
      continue;
    }

    items.push(toLatestItem(kind, id, manifest, downloads, integrity));

    if (items.length >= 5) {
      break;
    }
  }

  return items;
}

export async function fetchRailyardLatestRegistryItems(): Promise<RailyardLatestRegistryItem[]> {
  const [mapItems, modItems] = await Promise.all([
    fetchAndBuildItemsForKind("map", "maps"),
    fetchAndBuildItemsForKind("mod", "mods"),
  ]);

  return [...mapItems, ...modItems].sort((a, b) => b.lastActivityAt - a.lastActivityAt).slice(0, 5);
}
