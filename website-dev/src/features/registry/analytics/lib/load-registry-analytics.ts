import { loadCreatorDatabaseData } from "@/features/registry/authors/lib/load-creator-database";
import { loadRegistryItemsForType } from "@/features/registry/lib/load-registry-cache";
import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";

export type RegistryAnalyticsPeriodId = "all-time" | "3d" | "7d" | "14d";

export type RegistryAnalyticsHistoryPoint = {
  date: string;
  downloads: {
    total: number;
    maps: number;
    mods: number;
  };
  listings: {
    total: number;
    maps: number;
    mods: number;
  };
};

export type RegistryAnalyticsData = {
  overview: {
    downloads: number;
    listings: number;
    authors: number;
    maps: {
      listings: number;
      downloads: number;
    };
    mods: {
      listings: number;
      downloads: number;
    };
  };
  history: RegistryAnalyticsHistoryPoint[];
};

type CsvRow = Record<string, string>;

const ASSETS_BY_DAY_URL = "/registry-cache/analytics/assets_by_day.csv";

function safeFetchText(url: string): Promise<string> {
  return fetch(url).then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  });
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      quoted = !quoted;
      continue;
    }

    if (character === "," && !quoted) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
}

function parseCsv(raw: string): CsvRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "");

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function getNumber(value: string | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDate(value: string | undefined): string {
  return (value ?? "").replaceAll("_", "-");
}

function normalizeHistory(rows: CsvRow[]): RegistryAnalyticsHistoryPoint[] {
  return rows
    .map((row) => ({
      date: normalizeDate(row.snapshot_date),
      downloads: {
        total: getNumber(row.total_downloads_clamped || row.total_downloads),
        maps: getNumber(row.maps_clamped || row.maps),
        mods: getNumber(row.mods_clamped || row.mods),
      },
      listings: {
        total: getNumber(row.total_new_assets),
        maps: getNumber(row.new_maps),
        mods: getNumber(row.new_mods),
      },
    }))
    .filter((row) => row.date)
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function filterRegistryAnalyticsHistory(
  history: RegistryAnalyticsHistoryPoint[],
  period: RegistryAnalyticsPeriodId,
) {
  const periodDays = period === "all-time" ? null : Number.parseInt(period, 10);
  if (!periodDays || history.length <= periodDays) return history;
  return history.slice(-periodDays);
}

export function sumRegistryAnalyticsHistory(history: RegistryAnalyticsHistoryPoint[]) {
  return history.reduce(
    (totals, row) => ({
      downloads: {
        total: totals.downloads.total + row.downloads.total,
        maps: totals.downloads.maps + row.downloads.maps,
        mods: totals.downloads.mods + row.downloads.mods,
      },
      listings: {
        total: totals.listings.total + row.listings.total,
        maps: totals.listings.maps + row.listings.maps,
        mods: totals.listings.mods + row.listings.mods,
      },
    }),
    {
      downloads: { total: 0, maps: 0, mods: 0 },
      listings: { total: 0, maps: 0, mods: 0 },
    },
  );
}

export async function loadRegistryAnalyticsData(): Promise<RegistryAnalyticsData> {
  const [analyticsRaw, creatorData, itemEntries] = await Promise.all([
    safeFetchText(ASSETS_BY_DAY_URL),
    loadCreatorDatabaseData(),
    Promise.all(
      REGISTRY_TYPES.map((typeConfig) =>
        loadRegistryItemsForType(typeConfig.id, typeConfig.routeSegment),
      ),
    ),
  ]);

  const rows = parseCsv(analyticsRaw);
  const history = normalizeHistory(rows);
  const allItems = itemEntries.flat();
  const maps = allItems.filter((item) => item.type === "maps");
  const mods = allItems.filter((item) => item.type === "mods");
  const mapDownloads = maps.reduce((sum, item) => sum + item.totalDownloads, 0);
  const modDownloads = mods.reduce((sum, item) => sum + item.totalDownloads, 0);

  return {
    overview: {
      downloads: mapDownloads + modDownloads,
      listings: allItems.length,
      authors: creatorData.authors.length,
      maps: {
        listings: maps.length,
        downloads: mapDownloads,
      },
      mods: {
        listings: mods.length,
        downloads: modDownloads,
      },
    },
    history,
  };
}
