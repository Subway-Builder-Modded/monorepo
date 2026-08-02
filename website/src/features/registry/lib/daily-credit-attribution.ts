import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";

/**
 * Day-grain caretaker crediting, shared by every surface that renders daily
 * download series per person (author-page history/trends, top-authors charts).
 * Each day's downloads for a listing go to whoever held the listing's
 * caretaker window that day, falling back to the primary author — the
 * day-grain analogue of the per-version released_at crediting rule.
 */

type ManifestCaretakerWindow = { github_id?: unknown; since?: string; until?: string };

export type ListingCreditWindow = { since: number; until: number | null; personId: string };

function toGithubId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizePersonId(value: string) {
  return value.trim().toLowerCase();
}

export function getTypeIdForDailyListingType(listingType: string | undefined): string | null {
  return listingType === "map" ? "maps" : listingType === "mod" ? "mods" : null;
}

/** Extracts the ascending per-day download points from a wide by-day CSV row. */
export function extractDailyDownloadHistory(row: Record<string, string>) {
  return Object.entries(row)
    .filter(([key]) => /^\d{4}_\d{2}_\d{2}$/.test(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => ({
      date: key.replace(/_/g, "-"),
      downloads: Number(value) || 0,
    }));
}

/**
 * Extracts caretaker windows from every listing manifest, resolving each
 * caretaker github_id to an author login. Keyed by `${typeId}:${listingId}`
 * (typeId = "maps"/"mods") to match daily-analytics lookups.
 */
export function buildListingCreditWindows(
  allItemsByType: Record<string, RegistrySearchItem[]>,
  authorLoginByGithubId: ReadonlyMap<number, string>,
): Map<string, ListingCreditWindow[]> {
  const windowsByListing = new Map<string, ListingCreditWindow[]>();

  for (const typeConfig of REGISTRY_TYPES) {
    for (const item of allItemsByType[typeConfig.id] ?? []) {
      const caretakers = (item.manifest as { caretakers?: ManifestCaretakerWindow[] }).caretakers;
      if (!Array.isArray(caretakers) || caretakers.length === 0) continue;

      const windows: ListingCreditWindow[] = [];
      for (const window of caretakers) {
        const githubId = toGithubId(window.github_id);
        const since = Date.parse(window.since ?? "");
        if (githubId === null || !Number.isFinite(since)) continue;
        const personId = authorLoginByGithubId.get(githubId);
        if (!personId) continue;
        const until = Date.parse(window.until ?? "");
        windows.push({
          since,
          until: Number.isFinite(until) ? until : null,
          personId: normalizePersonId(personId),
        });
      }
      if (windows.length > 0) {
        windowsByListing.set(`${typeConfig.id}:${item.id}`, windows);
      }
    }
  }

  return windowsByListing;
}

/**
 * The person credited for a listing's downloads on a given day: the caretaker
 * whose [since, until) window contains the day, the primary author otherwise.
 */
export function resolveCreditedPersonIdForDate(
  dateTs: number,
  windows: ListingCreditWindow[] | undefined,
  primaryAuthorId: string,
): string {
  if (windows) {
    for (const window of windows) {
      if (dateTs >= window.since && (window.until === null || dateTs < window.until)) {
        return window.personId;
      }
    }
  }
  return primaryAuthorId;
}

export type AuthorDailyDownloads = {
  id: string;
  byDate: Map<string, { maps: number; mods: number }>;
};

/**
 * Folds listing-grain by-day rows into per-person daily download series using
 * day-grain caretaker crediting. Returns the sorted date universe alongside
 * one series per credited person (excluding `excludedPersonIds`).
 */
export function buildAuthorDailyDownloadSeries({
  dailyRows,
  items,
  creditWindowsByListing,
  excludedPersonIds = [],
}: {
  dailyRows: Array<Record<string, string>>;
  items: RegistrySearchItem[];
  creditWindowsByListing: ReadonlyMap<string, ListingCreditWindow[]>;
  excludedPersonIds?: string[];
}): { dates: string[]; authors: AuthorDailyDownloads[] } {
  const authorByTypeKey = new Map<string, string>();
  for (const item of items) {
    authorByTypeKey.set(
      `${item.type}:${item.id}`,
      normalizePersonId(item.authorId ?? item.author ?? ""),
    );
  }

  const excluded = new Set(excludedPersonIds.map(normalizePersonId));
  const allDates = new Set<string>();
  const seriesById = new Map<string, AuthorDailyDownloads>();

  for (const row of dailyRows) {
    const typeId = getTypeIdForDailyListingType(row["listing_type"]);
    const id = row["id"] ?? "";
    if (!typeId) continue;
    const typeKey = `${typeId}:${id}`;
    const listingAuthorId = authorByTypeKey.get(typeKey);
    if (!listingAuthorId) continue;
    const windows = creditWindowsByListing.get(typeKey);

    for (const point of extractDailyDownloadHistory(row)) {
      allDates.add(point.date);
      if (point.downloads <= 0) continue;

      const creditedId = resolveCreditedPersonIdForDate(
        Date.parse(point.date),
        windows,
        listingAuthorId,
      );
      if (!creditedId || excluded.has(creditedId)) continue;

      const series = seriesById.get(creditedId) ?? { id: creditedId, byDate: new Map() };
      const current = series.byDate.get(point.date) ?? { maps: 0, mods: 0 };
      if (typeId === "maps") current.maps += point.downloads;
      if (typeId === "mods") current.mods += point.downloads;
      series.byDate.set(point.date, current);
      seriesById.set(creditedId, series);
    }
  }

  return {
    dates: [...allDates].sort((left, right) => left.localeCompare(right)),
    authors: [...seriesById.values()],
  };
}
