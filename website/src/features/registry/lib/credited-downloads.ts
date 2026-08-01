import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";
import { REGISTRY_CACHE_PUBLIC_BASE } from "@/features/registry/lib/registry-asset-paths";
import type { ListingVersionCredits } from "@/features/registry/lib/load-listing-version-credits";

/**
 * The registry's shared admin account. It owns orphaned assets on behalf of
 * their caretakers and must never surface as a creator in author-facing
 * rankings or analytics — its downloads are credited to caretakers instead.
 */
export const ADMIN_AUTHOR_ID = "subway-builder-modded-admin";

export type AuthorDownloadTotals = { total: number; maps: number; mods: number };

/** typeId ("maps"/"mods") -> listing id -> version -> downloads. */
export type VersionDownloadsByTypeId = Record<string, Record<string, Record<string, number>>>;

function safeJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getTypeIdForCreditsListingType(listingType: string | undefined): string | null {
  return listingType === "map" ? "maps" : listingType === "mod" ? "mods" : null;
}

export async function loadVersionDownloadsByTypeId(): Promise<VersionDownloadsByTypeId> {
  const entries = await Promise.all(
    REGISTRY_TYPES.map(async (typeConfig) => {
      try {
        const response = await fetch(
          `${REGISTRY_CACHE_PUBLIC_BASE}/${typeConfig.routeSegment}/downloads.json`,
        );
        const raw = response.ok ? await response.text() : "{}";
        return [typeConfig.id, safeJson<Record<string, Record<string, number>>>(raw, {})] as const;
      } catch {
        return [typeConfig.id, {}] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
}

/**
 * Sums per-version downloads for every credited person: a person's total is
 * the sum of downloads of the exact (listing, version) pairs credited to them.
 * Returns null when nothing could be summed (e.g. downloads.json unavailable)
 * so callers can fall back to primary-author totals.
 */
export function computeCreditedTotalsByAuthor(
  credits: ListingVersionCredits,
  versionDownloadsByTypeId: VersionDownloadsByTypeId,
): Map<string, AuthorDownloadTotals> | null {
  const totalsByAuthor = new Map<string, AuthorDownloadTotals>();
  let hasDownloads = false;

  for (const [listingKey, versionCredits] of credits.creditsByListing) {
    const separatorIndex = listingKey.indexOf(":");
    const listingType = listingKey.slice(0, separatorIndex);
    const listingId = listingKey.slice(separatorIndex + 1);
    const typeId = getTypeIdForCreditsListingType(listingType);
    if (!typeId) continue;

    const listingDownloads = versionDownloadsByTypeId[typeId]?.[listingId];
    if (!listingDownloads) continue;

    for (const [version, creditedAuthorId] of versionCredits) {
      const downloads = listingDownloads[version];
      if (typeof downloads !== "number" || !Number.isFinite(downloads) || downloads <= 0) {
        continue;
      }

      hasDownloads = true;
      const normalizedId = creditedAuthorId.trim().toLowerCase();
      const current = totalsByAuthor.get(normalizedId) ?? { total: 0, maps: 0, mods: 0 };
      current.total += downloads;
      if (typeId === "maps") current.maps += downloads;
      if (typeId === "mods") current.mods += downloads;
      totalsByAuthor.set(normalizedId, current);
    }
  }

  return hasDownloads ? totalsByAuthor : null;
}

/**
 * Computes per-person download deltas produced by caretaker credits: for every
 * version credited to someone other than the listing's primary author, the
 * downloads move from the author to the credited person. Listings without a
 * caretaker window contribute nothing, so applying the deltas on top of
 * author-grain totals leaves untouched authors byte-identical.
 */
export function computeCreditDeltasByAuthor(
  credits: ListingVersionCredits,
  versionDownloadsByTypeId: VersionDownloadsByTypeId,
  primaryAuthorByListingKey: Map<string, string>,
): Map<string, AuthorDownloadTotals> {
  const deltasByAuthor = new Map<string, AuthorDownloadTotals>();
  const addDelta = (normalizedId: string, typeId: string, downloads: number) => {
    const current = deltasByAuthor.get(normalizedId) ?? { total: 0, maps: 0, mods: 0 };
    current.total += downloads;
    if (typeId === "maps") current.maps += downloads;
    if (typeId === "mods") current.mods += downloads;
    deltasByAuthor.set(normalizedId, current);
  };

  for (const [listingKey, versionCredits] of credits.creditsByListing) {
    const primaryAuthorId = primaryAuthorByListingKey.get(listingKey);
    if (!primaryAuthorId) continue;

    const separatorIndex = listingKey.indexOf(":");
    const typeId = getTypeIdForCreditsListingType(listingKey.slice(0, separatorIndex));
    if (!typeId) continue;

    const listingDownloads =
      versionDownloadsByTypeId[typeId]?.[listingKey.slice(separatorIndex + 1)];
    if (!listingDownloads) continue;

    for (const [version, creditedAuthorId] of versionCredits) {
      const normalizedCreditedId = creditedAuthorId.trim().toLowerCase();
      if (normalizedCreditedId === primaryAuthorId) continue;

      const downloads = listingDownloads[version];
      if (typeof downloads !== "number" || !Number.isFinite(downloads) || downloads <= 0) {
        continue;
      }

      addDelta(primaryAuthorId, typeId, -downloads);
      addDelta(normalizedCreditedId, typeId, downloads);
    }
  }

  return deltasByAuthor;
}

