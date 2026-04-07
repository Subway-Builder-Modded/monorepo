import { readFileSync } from 'node:fs';
import path from 'node:path';
import type {
  RailyardAnalyticsData,
  RailyardAssetDownloadRow,
  RailyardDailyTotalRow,
  RailyardHourlyTotalRow,
  RailyardOsTotalsPoint,
  RailyardOverlapPeriod,
  RailyardOverlapPoint,
  RailyardVersionDailyRow,
  RailyardVersionDownloadRow,
  RailyardVersionHourlyRow,
} from '@/types/railyard-analytics';
import { getRailyardAssetLabel } from '@/lib/railyard-asset-label';

export type {
  RailyardAnalyticsData,
  RailyardAssetDownloadRow,
  RailyardDailyTotalRow,
  RailyardHourlyTotalRow,
  RailyardOsTotalsPoint,
  RailyardOverlapPeriod,
  RailyardOverlapPoint,
  RailyardVersionDailyRow,
  RailyardVersionDownloadRow,
  RailyardVersionHourlyRow,
} from '@/types/railyard-analytics';

type DownloadMetricRaw = {
  total_downloads?: unknown;
  last_1d_downloads?: unknown;
  last_3d_downloads?: unknown;
  last_7d_downloads?: unknown;
};

type VersionRaw = DownloadMetricRaw & {
  assets?: Record<string, DownloadMetricRaw>;
};

type DownloadSnapshotRaw = {
  schema_version?: unknown;
  repo?: unknown;
  generated_at?: unknown;
  latest_snapshot?: unknown;
  versions?: Record<string, VersionRaw>;
};

type HistoryVersionRaw = {
  total_downloads?: unknown;
  assets?: Record<string, unknown>;
};

type HistorySnapshotRaw = {
  captured_at?: unknown;
  versions?: Record<string, HistoryVersionRaw>;
};

type DownloadHistoryRaw = {
  snapshots?: Record<string, HistorySnapshotRaw>;
};

const ANALYTICS_DIR =
  process.env['RAILYARD_ANALYTICS_DIR']?.trim() ||
  path.join(process.cwd(), 'public', 'railyard', 'analytics');

const RAILYARD_ANALYTICS_PATHS = {
  downloadsJson: path.join(ANALYTICS_DIR, 'railyard_app_downloads.json'),
  downloadsCsv: path.join(ANALYTICS_DIR, 'railyard_app_by_day.csv'),
  downloadsHistoryJson: path.join(
    ANALYTICS_DIR,
    'railyard_app_downloads_history.json',
  ),
} as const;

let warnedMissingAnalytics = false;

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toString(value: unknown, fallback = ''): string {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : fallback;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i] ?? '';
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0] ?? '').map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const cols = parseCSVLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, (cols[index] ?? '').trim()]),
    );
  });
}

function readJsonFile<T>(
  fullPath: string,
  fallback: T,
  sourceLabel: string,
): T {
  try {
    const text = readFileSync(fullPath, 'utf-8');
    return JSON.parse(text) as T;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      if (!warnedMissingAnalytics) {
        warnedMissingAnalytics = true;
        console.warn(
          `[railyard] Analytics cache not found at "${ANALYTICS_DIR}". Run pnpm generate:railyard-analytics-cache to populate it.`,
        );
      }
      return fallback;
    }
    if (error instanceof SyntaxError) {
      console.warn(
        `[railyard] Invalid JSON in ${sourceLabel}; using fallback.`,
      );
      return fallback;
    }
    throw error;
  }
}

function readCsvFile(fullPath: string): Record<string, string>[] {
  try {
    const text = readFileSync(fullPath, 'utf-8');
    return parseCSV(text);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      if (!warnedMissingAnalytics) {
        warnedMissingAnalytics = true;
        console.warn(
          `[railyard] Analytics cache not found at "${ANALYTICS_DIR}". Run pnpm generate:railyard-analytics-cache to populate it.`,
        );
      }
      return [];
    }
    throw error;
  }
}

function parseAssetMetadata(assetName: string): {
  os: string;
  arch: string;
  packageType: string;
} {
  const lower = assetName.toLowerCase();

  const os = lower.includes('windows')
    ? 'Windows'
    : lower.includes('macos')
      ? 'macOS'
      : lower.includes('linux')
        ? 'Linux'
        : 'Other';

  const arch = lower.includes('arm64')
    ? 'arm64'
    : lower.includes('amd64') || lower.includes('x64')
      ? 'x64'
      : lower.includes('universal')
        ? 'universal'
        : 'unknown';

  const extension = /\.(exe|zip|dmg|flatpak)$/.exec(lower)?.[1] ?? 'other';

  return {
    os,
    arch,
    packageType: extension.toUpperCase(),
  };
}

function parseDownloadMetric(value: DownloadMetricRaw) {
  return {
    totalDownloads: toNumber(value.total_downloads),
    last1dDownloads: toNullableNumber(value.last_1d_downloads),
    last3dDownloads: toNullableNumber(value.last_3d_downloads),
    last7dDownloads: toNullableNumber(value.last_7d_downloads),
  };
}

function compareVersionsDesc(left: string, right: string): number {
  const leftParts = left.split('.').map((part) => Number(part));
  const rightParts = right.split('.').map((part) => Number(part));
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const l = leftParts[index] ?? 0;
    const r = rightParts[index] ?? 0;
    if (l !== r) return r - l;
  }

  return right.localeCompare(left);
}

function buildVersionRows(snapshot: DownloadSnapshotRaw): {
  versions: RailyardVersionDownloadRow[];
  flattenedAssets: RailyardAssetDownloadRow[];
} {
  const versionsRaw = snapshot.versions ?? {};
  const versionRows: RailyardVersionDownloadRow[] = [];
  const assets: RailyardAssetDownloadRow[] = [];

  for (const [version, raw] of Object.entries(versionsRaw)) {
    const assetRows = Object.entries(raw.assets ?? {}).map(
      ([assetName, metric]) => {
        const metadata = parseAssetMetadata(assetName);
        const parsed = {
          assetName,
          assetLabel: getRailyardAssetLabel(assetName),
          ...metadata,
          ...parseDownloadMetric(metric),
        };
        assets.push(parsed);
        return parsed;
      },
    );

    versionRows.push({
      version,
      ...parseDownloadMetric(raw),
      assets: assetRows.sort((a, b) => b.totalDownloads - a.totalDownloads),
    });
  }

  versionRows.sort((a, b) => compareVersionsDesc(a.version, b.version));
  assets.sort((a, b) => b.totalDownloads - a.totalDownloads);

  return {
    versions: versionRows,
    flattenedAssets: assets,
  };
}

function parseVersionDailyRows(rows: Record<string, string>[]): {
  versionDaily: RailyardVersionDailyRow[];
  dailyTotals: RailyardDailyTotalRow[];
} {
  const dateColumns = new Set<string>();

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (/^\d{4}_\d{2}_\d{2}$/.test(key)) {
        dateColumns.add(key);
      }
    }
  }

  const sortedDateColumns = [...dateColumns].sort((a, b) => a.localeCompare(b));
  const dailyTotalMap = new Map<string, number>();

  const versionDaily = rows
    .map((row) => {
      const version = toString(row['version']);
      const csvTotalDownloads = toNumber(row['total_downloads']);
      const daily = sortedDateColumns.map((column) => {
        const date = column.replaceAll('_', '-');
        const downloads = toNumber(row[column]);
        dailyTotalMap.set(date, (dailyTotalMap.get(date) ?? 0) + downloads);
        return { date, downloads };
      });

      return {
        version,
        csvTotalDownloads,
        daily,
      };
    })
    .filter((row) => row.version.length > 0)
    .sort((a, b) => compareVersionsDesc(a.version, b.version));

  const dailyTotals = [...dailyTotalMap.entries()]
    .map(([date, downloads]) => ({ date, downloads }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { versionDaily, dailyTotals };
}

function osKeyFromOsLabel(
  os: string,
): keyof Omit<RailyardOsTotalsPoint, 'timestamp' | 'downloads'> | null {
  if (os === 'Windows') return 'windows';
  if (os === 'macOS') return 'macos';
  if (os === 'Linux') return 'linux';
  return null;
}

function buildOsDailyTotals(args: {
  versions: RailyardVersionDownloadRow[];
  versionDaily: RailyardVersionDailyRow[];
}): RailyardOsTotalsPoint[] {
  const versionMap = new Map(args.versions.map((row) => [row.version, row]));
  const dateMap = new Map<string, Omit<RailyardOsTotalsPoint, 'timestamp'>>();

  for (const versionRow of args.versionDaily) {
    const versionMeta = versionMap.get(versionRow.version);
    if (!versionMeta || versionMeta.totalDownloads <= 0) continue;

    const osRatios: Array<{
      key: keyof Omit<RailyardOsTotalsPoint, 'timestamp' | 'downloads'>;
      ratio: number;
    }> = [];
    for (const asset of versionMeta.assets) {
      const key = osKeyFromOsLabel(asset.os);
      if (!key) continue;
      osRatios.push({
        key,
        ratio: asset.totalDownloads / versionMeta.totalDownloads,
      });
    }

    for (const dailyPoint of versionRow.daily) {
      const entry = dateMap.get(dailyPoint.date) ?? {
        windows: 0,
        macos: 0,
        linux: 0,
        downloads: 0,
      };

      for (const ratio of osRatios) {
        entry[ratio.key] += dailyPoint.downloads * ratio.ratio;
      }
      entry.downloads += dailyPoint.downloads;
      dateMap.set(dailyPoint.date, entry);
    }
  }

  return [...dateMap.entries()]
    .map(([timestamp, totals]) => ({ timestamp, ...totals }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function buildHourlySeries(history: DownloadHistoryRaw): {
  versionHourly: RailyardVersionHourlyRow[];
  hourlyTotals: RailyardHourlyTotalRow[];
  osHourlyTotals: RailyardOsTotalsPoint[];
} {
  const snapshotEntries = Object.entries(history.snapshots ?? {}).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  if (snapshotEntries.length < 2) {
    return {
      versionHourly: [],
      hourlyTotals: [],
      osHourlyTotals: [],
    };
  }

  const versionPoints = new Map<string, RailyardVersionHourlyRow['hourly']>();
  const hourlyTotals: RailyardHourlyTotalRow[] = [];
  const osHourlyTotals: RailyardOsTotalsPoint[] = [];

  for (let index = 1; index < snapshotEntries.length; index += 1) {
    const [timestamp, currentSnapshot] = snapshotEntries[index] ?? [];
    const [, previousSnapshot] = snapshotEntries[index - 1] ?? [];

    const currentVersions = currentSnapshot?.versions ?? {};
    const previousVersions = previousSnapshot?.versions ?? {};

    const allVersions = new Set<string>([
      ...Object.keys(previousVersions),
      ...Object.keys(currentVersions),
    ]);

    let totalDownloads = 0;
    for (const version of allVersions) {
      const current = toNumber(currentVersions[version]?.total_downloads);
      const previous = toNumber(previousVersions[version]?.total_downloads);
      const delta = Math.max(0, current - previous);
      totalDownloads += delta;

      const points = versionPoints.get(version) ?? [];
      points.push({ timestamp, downloads: delta });
      versionPoints.set(version, points);
    }

    const osTotals = {
      windows: 0,
      macos: 0,
      linux: 0,
    };

    for (const version of allVersions) {
      const currentAssets = currentVersions[version]?.assets ?? {};
      const previousAssets = previousVersions[version]?.assets ?? {};
      const allAssets = new Set<string>([
        ...Object.keys(previousAssets),
        ...Object.keys(currentAssets),
      ]);

      for (const assetName of allAssets) {
        const current = toNumber(currentAssets[assetName]);
        const previous = toNumber(previousAssets[assetName]);
        const delta = Math.max(0, current - previous);
        const osKey = osKeyFromOsLabel(parseAssetMetadata(assetName).os);
        if (!osKey) continue;
        osTotals[osKey] += delta;
      }
    }

    const osDownloads = osTotals.windows + osTotals.macos + osTotals.linux;

    hourlyTotals.push({ timestamp, downloads: totalDownloads });
    osHourlyTotals.push({
      timestamp,
      ...osTotals,
      downloads: osDownloads,
    });
  }

  const versionHourly = [...versionPoints.entries()]
    .map(([version, hourly]) => ({ version, hourly }))
    .sort((a, b) => compareVersionsDesc(a.version, b.version));

  return {
    versionHourly,
    hourlyTotals,
    osHourlyTotals,
  };
}

function formatSnapshotLabel(input: string): string {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  const hour = String(parsed.getUTCHours()).padStart(2, '0');
  const minute = String(parsed.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute} UTC`;
}

function buildOverlapRows(
  dailyTotals: RailyardDailyTotalRow[],
  days: RailyardOverlapPeriod,
): RailyardOverlapPoint[] {
  const rows = [...dailyTotals].sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length === 0) return [];

  const currentWindow = rows.slice(-days);
  const previousWindow = rows.slice(-(days * 2), -days);

  return Array.from({ length: days }, (_, index) => {
    const current = currentWindow[index];
    const previous = previousWindow[index];
    const currentDate = current?.date;
    const label = currentDate
      ? (() => {
          const [, month, day] = currentDate.split('-');
          return `${month}/${day}`;
        })()
      : `Day ${index + 1}`;

    return {
      index: index + 1,
      label,
      currentDate,
      previousDate: previous?.date,
      currentDownloads: current?.downloads ?? 0,
      previousDownloads: previous?.downloads ?? 0,
    };
  });
}

function buildSummary(args: {
  versions: RailyardVersionDownloadRow[];
  flattenedAssets: RailyardAssetDownloadRow[];
}): RailyardAnalyticsData['summary'] {
  const { versions, flattenedAssets } = args;

  const totalDownloads = versions.reduce(
    (sum, row) => sum + row.totalDownloads,
    0,
  );

  const topVersion = [...versions].sort(
    (a, b) => b.totalDownloads - a.totalDownloads,
  )[0];

  const assetTotals = new Map<string, number>();
  for (const asset of flattenedAssets) {
    assetTotals.set(
      asset.assetLabel,
      (assetTotals.get(asset.assetLabel) ?? 0) + asset.totalDownloads,
    );
  }
  const topAsset = [...assetTotals.entries()]
    .map(([label, downloads]) => ({ label, downloads }))
    .sort((a, b) => b.downloads - a.downloads)[0];

  const osTotals = new Map<string, number>();
  for (const asset of flattenedAssets) {
    if (
      asset.os !== 'Windows' &&
      asset.os !== 'macOS' &&
      asset.os !== 'Linux'
    ) {
      continue;
    }
    osTotals.set(
      asset.os,
      (osTotals.get(asset.os) ?? 0) + asset.totalDownloads,
    );
  }
  const topOs = [...osTotals.entries()]
    .map(([label, downloads]) => ({ label, downloads }))
    .sort((a, b) => b.downloads - a.downloads)[0];

  return {
    totalDownloads,
    totalVersions: versions.length,
    totalAssets: flattenedAssets.length,
    latestVersion: versions[0]?.version ?? 'Unknown',
    topVersion: topVersion?.version ?? 'Unknown',
    topVersionDownloads: topVersion?.totalDownloads ?? 0,
    topAsset: topAsset?.label ?? 'Unknown',
    topAssetDownloads: topAsset?.downloads ?? 0,
    topOs: topOs?.label ?? 'Unknown',
    topOsDownloads: topOs?.downloads ?? 0,
    current1dDownloads: versions.reduce(
      (sum, row) => sum + (row.last1dDownloads ?? 0),
      0,
    ),
    current3dDownloads: versions.reduce(
      (sum, row) => sum + (row.last3dDownloads ?? 0),
      0,
    ),
    current7dDownloads: versions.reduce(
      (sum, row) => sum + (row.last7dDownloads ?? 0),
      0,
    ),
  };
}

export function loadRailyardAnalytics(): RailyardAnalyticsData {
  const snapshot = readJsonFile<DownloadSnapshotRaw>(
    RAILYARD_ANALYTICS_PATHS.downloadsJson,
    {},
    'railyard_app_downloads.json',
  );

  const csvRows = readCsvFile(RAILYARD_ANALYTICS_PATHS.downloadsCsv);
  const history = readJsonFile<DownloadHistoryRaw>(
    RAILYARD_ANALYTICS_PATHS.downloadsHistoryJson,
    {},
    'railyard_app_downloads_history.json',
  );
  const { versions, flattenedAssets } = buildVersionRows(snapshot);
  const { versionDaily, dailyTotals } = parseVersionDailyRows(csvRows);
  const { versionHourly, hourlyTotals, osHourlyTotals } =
    buildHourlySeries(history);
  const osDailyTotals = buildOsDailyTotals({ versions, versionDaily });

  return {
    schemaVersion: toNumber(snapshot.schema_version),
    repo: toString(snapshot.repo, 'Unknown'),
    generatedAt: toString(snapshot.generated_at, 'Unknown'),
    latestSnapshot: toString(snapshot.latest_snapshot, 'Unknown'),
    snapshotLabel: formatSnapshotLabel(toString(snapshot.latest_snapshot)),
    summary: buildSummary({ versions, flattenedAssets }),
    versions,
    versionDaily,
    versionHourly,
    dailyTotals,
    hourlyTotals,
    osDailyTotals,
    osHourlyTotals,
    overlaps: {
      7: buildOverlapRows(dailyTotals, 7),
      14: buildOverlapRows(dailyTotals, 14),
      30: buildOverlapRows(dailyTotals, 30),
    },
  };
}
