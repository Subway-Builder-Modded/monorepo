import { REGISTRY_CACHE_PUBLIC_BASE } from "@/features/registry/lib/registry-asset-paths";

/**
 * Per-version download credits sourced from the registry artifact
 * `analytics/listing_version_credits.csv`. Each version of every non-test
 * listing is mapped to the person credited for its downloads (the primary
 * author or the caretaker whose window covers the version's release).
 */
export type ListingVersionCredits = {
  /** `${listing_type}:${listing_id}` -> version -> credited author id (as written in the CSV). */
  creditsByListing: Map<string, Map<string, string>>;
  /** Normalized (lowercased) author id -> `${listing_type}:${listing_id}` -> credited versions. */
  creditsByAuthor: Map<string, Map<string, Set<string>>>;
};

/** Builds the listing key used by the credits maps, e.g. `map:opo-pt-metropolitan`. */
export function getListingVersionCreditsKey(listingType: string, listingId: string): string {
  return `${listingType}:${listingId}`;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += character;
    }
  }

  result.push(current);
  return result;
}

/**
 * Parses `listing_version_credits.csv` text into the credits maps.
 * Returns null when the text has no usable header or no valid data rows so
 * callers can fall back to author-keyed behavior.
 */
export function parseListingVersionCredits(csvText: string): ListingVersionCredits | null {
  const lines = csvText
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  const [headerLine, ...bodyLines] = lines;
  if (!headerLine || bodyLines.length === 0) {
    return null;
  }

  const headers = parseCsvLine(headerLine).map((header) => header.trim());
  const listingTypeIndex = headers.indexOf("listing_type");
  const listingIdIndex = headers.indexOf("listing_id");
  const versionIndex = headers.indexOf("version");
  const creditedAuthorIndex = headers.indexOf("credited_author_id");
  if (
    listingTypeIndex === -1 ||
    listingIdIndex === -1 ||
    versionIndex === -1 ||
    creditedAuthorIndex === -1
  ) {
    return null;
  }

  const creditsByListing = new Map<string, Map<string, string>>();
  const creditsByAuthor = new Map<string, Map<string, Set<string>>>();

  for (const line of bodyLines) {
    const values = parseCsvLine(line);
    const listingType = (values[listingTypeIndex] ?? "").trim();
    const listingId = (values[listingIdIndex] ?? "").trim();
    const version = (values[versionIndex] ?? "").trim();
    const creditedAuthorId = (values[creditedAuthorIndex] ?? "").trim();
    if (!listingType || !listingId || !version || !creditedAuthorId) {
      continue;
    }

    const listingKey = getListingVersionCreditsKey(listingType, listingId);
    const listingCredits = creditsByListing.get(listingKey) ?? new Map<string, string>();
    listingCredits.set(version, creditedAuthorId);
    creditsByListing.set(listingKey, listingCredits);

    const normalizedAuthorId = creditedAuthorId.toLowerCase();
    const authorCredits = creditsByAuthor.get(normalizedAuthorId) ?? new Map<string, Set<string>>();
    const authorVersions = authorCredits.get(listingKey) ?? new Set<string>();
    authorVersions.add(version);
    authorCredits.set(listingKey, authorVersions);
    creditsByAuthor.set(normalizedAuthorId, authorCredits);
  }

  if (creditsByListing.size === 0) {
    return null;
  }

  return { creditsByListing, creditsByAuthor };
}

/**
 * Fetches and parses the listing version credits artifact.
 * Degrades gracefully: any fetch failure or absent/malformed file yields null
 * so callers keep their existing author-keyed behavior.
 */
export async function loadListingVersionCredits(): Promise<ListingVersionCredits | null> {
  try {
    const response = await fetch(
      `${REGISTRY_CACHE_PUBLIC_BASE}/analytics/listing_version_credits.csv`,
    );
    if (!response.ok) {
      return null;
    }
    return parseListingVersionCredits(await response.text());
  } catch {
    return null;
  }
}
