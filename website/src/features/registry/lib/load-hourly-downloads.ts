/**
 * The registry's hourly download series: one CSV per UTC month
 * (analytics/hourly/downloads-YYYY-MM.csv, schema
 * bucket_utc,listing_type,id,downloads), never pruned. Shared by the
 * site-wide analytics page and the per-entity (listing/author/project)
 * analytics tabs, all of which chart 4h buckets from it.
 */

/**
 * First day with hour-grain data. Before the registry's Cloudflare Worker
 * scheduler, hourly runs were too sparse to trust; the shard series starts
 * here.
 */
export const HOURLY_SERIES_FLOOR_DATE = "2026-07-01";

/**
 * Monthly hourly shard URLs, floor month through the current UTC month. A
 * month with no cached shard yet (first hours of a new month) is expected to
 * be missing.
 */
export function getHourlyShardUrls(nowMs = Date.now()): string[] {
  const urls: string[] = [];
  let year = Number.parseInt(HOURLY_SERIES_FLOOR_DATE.slice(0, 4), 10);
  let month = Number.parseInt(HOURLY_SERIES_FLOOR_DATE.slice(5, 7), 10);
  const now = new Date(nowMs);
  const endYear = now.getUTCFullYear();
  const endMonth = now.getUTCMonth() + 1;
  while (year < endYear || (year === endYear && month <= endMonth)) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    urls.push(`/registry-cache/analytics/hourly/downloads-${key}.csv`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return urls;
}

/**
 * Fetches every shard and merges them into one CSV text under a single
 * header, ready for any header-first CSV parser. Missing or failing shards
 * contribute nothing; null when no shard yielded rows, matching the tolerant
 * fetch helpers the per-entity loaders use.
 */
export async function loadHourlyDownloadsCsvText(nowMs = Date.now()): Promise<string | null> {
  const raws = await Promise.all(
    getHourlyShardUrls(nowMs).map((url) =>
      fetch(url)
        .then((response) => (response.ok ? response.text() : ""))
        .catch(() => ""),
    ),
  );
  const lines: string[] = [];
  for (const raw of raws) {
    const rawLines = raw.split(/\r?\n/).filter((line) => line.trim() !== "");
    if (rawLines.length === 0) continue;
    const [header, ...rows] = rawLines;
    if (lines.length === 0 && header) {
      lines.push(header);
    }
    lines.push(...rows);
  }
  return lines.length > 1 ? lines.join("\n") : null;
}
