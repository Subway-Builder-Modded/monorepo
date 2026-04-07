export type DownloadCounts = Record<string, number>;
export type AssetDownloadCountsByVersion = Record<string, DownloadCounts>;

export function sumVersionDownloads(
  counts: DownloadCounts | undefined,
): number {
  if (!counts) return 0;
  return Object.values(counts).reduce(
    (sum, count) => sum + (Number.isFinite(count) ? count : 0),
    0,
  );
}

export function toCumulativeDownloadTotals(
  countsByAsset: AssetDownloadCountsByVersion | undefined,
): Record<string, number> {
  if (!countsByAsset) return {};

  const totals: Record<string, number> = {};
  for (const [assetID, countsByVersion] of Object.entries(countsByAsset)) {
    totals[assetID] = sumVersionDownloads(countsByVersion);
  }

  return totals;
}
