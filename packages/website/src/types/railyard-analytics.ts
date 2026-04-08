export type RailyardDownloadMetric = {
  totalDownloads: number;
  last1dDownloads: number | null;
  last3dDownloads: number | null;
  last7dDownloads: number | null;
};

export type RailyardAssetDownloadRow = RailyardDownloadMetric & {
  assetName: string;
  assetLabel: string;
  os: string;
  arch: string;
  packageType: string;
};

export type RailyardVersionDownloadRow = RailyardDownloadMetric & {
  version: string;
  assets: RailyardAssetDownloadRow[];
};

export type RailyardVersionDailyPoint = {
  date: string;
  downloads: number;
};

export type RailyardVersionHourlyPoint = {
  timestamp: string;
  downloads: number;
};

export type RailyardVersionDailyRow = {
  version: string;
  csvTotalDownloads: number;
  daily: RailyardVersionDailyPoint[];
};

export type RailyardVersionHourlyRow = {
  version: string;
  hourly: RailyardVersionHourlyPoint[];
};

export type RailyardDailyTotalRow = {
  date: string;
  downloads: number;
};

export type RailyardHourlyTotalRow = {
  timestamp: string;
  downloads: number;
};

export type RailyardOsTotalsPoint = {
  timestamp: string;
  windows: number;
  macos: number;
  linux: number;
  downloads: number;
};

export type RailyardOverlapPeriod = 7 | 14 | 30;

export type RailyardOverlapPoint = {
  index: number;
  label: string;
  currentDate?: string;
  previousDate?: string;
  currentDownloads: number;
  previousDownloads: number;
};

export type RailyardAnalyticsSummary = {
  totalDownloads: number;
  totalVersions: number;
  totalAssets: number;
  latestVersion: string;
  topVersion: string;
  topVersionDownloads: number;
  topAsset: string;
  topAssetDownloads: number;
  topOs: string;
  topOsDownloads: number;
  current1dDownloads: number;
  current3dDownloads: number;
  current7dDownloads: number;
};

export type RailyardAnalyticsData = {
  schemaVersion: number;
  repo: string;
  generatedAt: string;
  latestSnapshot: string;
  snapshotLabel: string;
  summary: RailyardAnalyticsSummary;
  versions: RailyardVersionDownloadRow[];
  versionDaily: RailyardVersionDailyRow[];
  versionHourly: RailyardVersionHourlyRow[];
  dailyTotals: RailyardDailyTotalRow[];
  hourlyTotals: RailyardHourlyTotalRow[];
  osDailyTotals: RailyardOsTotalsPoint[];
  osHourlyTotals: RailyardOsTotalsPoint[];
  overlaps: Record<RailyardOverlapPeriod, RailyardOverlapPoint[]>;
};
