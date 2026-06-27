type RailyardAnalyticsOperatingSystemId = "windows" | "macos" | "linux" | "other";

export type RailyardAnalyticsVersion = {
  version: string;
  totalDownloads: number;
  lastDayDownloads: number;
  assets: Record<string, { totalDownloads: number; lastDayDownloads: number }>;
};

export type RailyardAnalyticsOverview = {
  totalDownloads: number;
  lastDayDownloads: number;
  versionCount: number;
  buildAssetCount: number;
  topVersion: RailyardAnalyticsVersion | null;
  topOperatingSystem: {
    id: RailyardAnalyticsOperatingSystemId;
    label: string;
    downloads: number;
  } | null;
};

export type RailyardAnalyticsData = {
  generatedAt: string | null;
  latestSnapshot: string | null;
  versions: RailyardAnalyticsVersion[];
  history: RailyardAnalyticsHistoryPoint[];
  overview: RailyardAnalyticsOverview;
};

export type RailyardAnalyticsHistoryPoint = {
  date: string;
  downloads: number;
  versions: Record<string, number>;
  operatingSystems: Record<RailyardAnalyticsOperatingSystemId, number>;
};

type RawRailyardAnalyticsAsset = {
  total_downloads?: unknown;
  last_1d_downloads?: unknown;
};

type RawRailyardAnalyticsVersion = {
  total_downloads?: unknown;
  last_1d_downloads?: unknown;
  assets?: Record<string, RawRailyardAnalyticsAsset>;
};

type RawRailyardAnalyticsDownloads = {
  generated_at?: unknown;
  latest_snapshot?: unknown;
  versions?: Record<string, RawRailyardAnalyticsVersion>;
};

type RawRailyardAnalyticsHistoryVersion = {
  total_downloads?: unknown;
  assets?: Record<string, unknown>;
};

type RawRailyardAnalyticsHistorySnapshot = {
  captured_at?: unknown;
  versions?: Record<string, RawRailyardAnalyticsHistoryVersion>;
};

type RawRailyardAnalyticsHistory = {
  snapshots?: Record<string, RawRailyardAnalyticsHistorySnapshot>;
};

const RAILYARD_ANALYTICS_URL = "/railyard/analytics/railyard_app_downloads.json";
const RAILYARD_ANALYTICS_HISTORY_URL = "/railyard/analytics/railyard_app_downloads_history.json";

function getNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function getOperatingSystemId(assetName: string): RailyardAnalyticsOperatingSystemId {
  const normalized = assetName.toLowerCase();
  if (normalized.includes("windows") || normalized.endsWith(".exe")) return "windows";
  if (normalized.includes("macos") || normalized.endsWith(".dmg")) return "macos";
  if (
    normalized.includes("linux") ||
    normalized.endsWith(".flatpak") ||
    normalized.endsWith(".appimage")
  ) {
    return "linux";
  }
  return "other";
}

function getOperatingSystemLabel(id: RailyardAnalyticsOperatingSystemId) {
  switch (id) {
    case "windows":
      return "Windows";
    case "macos":
      return "macOS";
    case "linux":
      return "Linux";
    case "other":
      return "Other";
  }
}

function toDateKey(value: string) {
  return value.slice(0, 10);
}

function normalizeHistory(raw: RawRailyardAnalyticsHistory): RailyardAnalyticsHistoryPoint[] {
  const snapshotsByDay = new Map<
    string,
    { capturedAt: string; versions: Record<string, RawRailyardAnalyticsHistoryVersion> }
  >();

  Object.entries(raw.snapshots ?? {})
    .map(([snapshotKey, snapshot]) => ({
      capturedAt: getString(snapshot.captured_at) ?? snapshotKey,
      versions: snapshot.versions ?? {},
    }))
    .forEach((snapshot) => {
      const date = toDateKey(snapshot.capturedAt);
      const current = snapshotsByDay.get(date);
      if (!current || snapshot.capturedAt > current.capturedAt) {
        snapshotsByDay.set(date, snapshot);
      }
    });

  const snapshots = [...snapshotsByDay.values()].sort((left, right) =>
    left.capturedAt.localeCompare(right.capturedAt),
  );

  let previousVersionTotals = new Map<string, number>();
  let previousOsTotals = new Map<RailyardAnalyticsOperatingSystemId, number>();

  return snapshots.map((snapshot) => {
    const versionTotals = new Map<string, number>();
    const osTotals = new Map<RailyardAnalyticsOperatingSystemId, number>();

    for (const [version, versionRow] of Object.entries(snapshot.versions)) {
      versionTotals.set(version, getNumber(versionRow.total_downloads));

      for (const [assetName, downloads] of Object.entries(versionRow.assets ?? {})) {
        const osId = getOperatingSystemId(assetName);
        osTotals.set(osId, (osTotals.get(osId) ?? 0) + getNumber(downloads));
      }
    }

    const versions: Record<string, number> = {};
    const operatingSystems: Record<RailyardAnalyticsOperatingSystemId, number> = {
      windows: 0,
      macos: 0,
      linux: 0,
      other: 0,
    };

    for (const [version, total] of versionTotals) {
      versions[version] = Math.max(0, total - (previousVersionTotals.get(version) ?? 0));
    }

    for (const [osId, total] of osTotals) {
      operatingSystems[osId] = Math.max(0, total - (previousOsTotals.get(osId) ?? 0));
    }

    previousVersionTotals = versionTotals;
    previousOsTotals = osTotals;

    return {
      date: toDateKey(snapshot.capturedAt),
      downloads: Object.values(versions).reduce((sum, downloads) => sum + downloads, 0),
      versions,
      operatingSystems,
    };
  });
}

function normalizeAnalytics(
  raw: RawRailyardAnalyticsDownloads,
  historyRaw: RawRailyardAnalyticsHistory,
): RailyardAnalyticsData {
  const versions = Object.entries(raw.versions ?? {}).map(([version, row]) => {
    const assets = Object.fromEntries(
      Object.entries(row.assets ?? {}).map(([assetName, asset]) => [
        assetName,
        {
          totalDownloads: getNumber(asset.total_downloads),
          lastDayDownloads: getNumber(asset.last_1d_downloads),
        },
      ]),
    );

    return {
      version,
      totalDownloads: getNumber(row.total_downloads),
      lastDayDownloads: getNumber(row.last_1d_downloads),
      assets,
    };
  });

  const osTotals = new Map<RailyardAnalyticsOperatingSystemId, number>();
  for (const version of versions) {
    for (const [assetName, asset] of Object.entries(version.assets)) {
      const osId = getOperatingSystemId(assetName);
      osTotals.set(osId, (osTotals.get(osId) ?? 0) + asset.totalDownloads);
    }
  }

  const topOperatingSystemEntry = [...osTotals.entries()].sort(
    (left, right) => right[1] - left[1],
  )[0];

  const topOperatingSystem = topOperatingSystemEntry
    ? {
        id: topOperatingSystemEntry[0],
        label: getOperatingSystemLabel(topOperatingSystemEntry[0]),
        downloads: topOperatingSystemEntry[1],
      }
    : null;

  const topVersion =
    [...versions].sort((left, right) => right.totalDownloads - left.totalDownloads)[0] ?? null;

  return {
    generatedAt: getString(raw.generated_at),
    latestSnapshot: getString(raw.latest_snapshot),
    versions,
    history: normalizeHistory(historyRaw),
    overview: {
      totalDownloads: versions.reduce((sum, version) => sum + version.totalDownloads, 0),
      lastDayDownloads: versions.reduce((sum, version) => sum + version.lastDayDownloads, 0),
      versionCount: versions.length,
      buildAssetCount: versions.reduce(
        (sum, version) => sum + Object.keys(version.assets).length,
        0,
      ),
      topVersion,
      topOperatingSystem,
    },
  };
}

export async function loadRailyardAnalyticsData(): Promise<RailyardAnalyticsData> {
  const [downloadsResponse, historyResponse] = await Promise.all([
    fetch(RAILYARD_ANALYTICS_URL),
    fetch(RAILYARD_ANALYTICS_HISTORY_URL),
  ]);

  if (!downloadsResponse.ok) {
    throw new Error(`Unable to load Railyard analytics (${downloadsResponse.status})`);
  }
  if (!historyResponse.ok) {
    throw new Error(`Unable to load Railyard analytics history (${historyResponse.status})`);
  }

  const raw = (await downloadsResponse.json()) as RawRailyardAnalyticsDownloads;
  const historyRaw = (await historyResponse.json()) as RawRailyardAnalyticsHistory;
  return normalizeAnalytics(raw, historyRaw);
}
