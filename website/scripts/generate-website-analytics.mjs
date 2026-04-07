import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ANALYTICS_DIR = path.join(ROOT, 'public', 'website');
const VALID_PATHS_FILE = path.join(ANALYTICS_DIR, 'valid-paths.json');
const PAGES_FILE = path.join(ANALYTICS_DIR, 'pages.json');
const COUNTRIES_FILE = path.join(ANALYTICS_DIR, 'countries.json');
const BROWSERS_FILE = path.join(ANALYTICS_DIR, 'browsers.json');
const OPERATING_SYSTEMS_FILE = path.join(ANALYTICS_DIR, 'operating-systems.json');
const DEVICES_FILE = path.join(ANALYTICS_DIR, 'devices.json');
const SCREEN_SIZES_FILE = path.join(ANALYTICS_DIR, 'screen-sizes.json');
const TIMESERIES_FILE = path.join(ANALYTICS_DIR, 'timeseries.json');
const SUMMARY_FILE = path.join(ANALYTICS_DIR, 'summary.json');
const SNAPSHOT_META_FILE = path.join(ANALYTICS_DIR, 'snapshot-meta.json');
const DAILY_HISTORY_FILE = path.join(ANALYTICS_DIR, 'daily-history.json');
const PATH_ALIASES_FILE = path.join(ANALYTICS_DIR, 'path-aliases.json');

const WEBSITE_PATH_SOURCE_DIR = path.join(ROOT, 'out');

const CLOUDFLARE_ZONE_TAG =
  process.env['CLOUDFLARE_ZONE_TAG']?.trim() ||
  process.env['CLOUDFLARE_ZONE_ID']?.trim() ||
  '';
const CLOUDFLARE_API_TOKEN =
  process.env['CLOUDFLARE_API_TOKEN']?.trim() ||
  process.env['CLOUDFLARE_TOKEN']?.trim() ||
  process.env['CF_API_TOKEN']?.trim() ||
  '';
const CLOUDFLARE_GRAPHQL_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

const PERIOD_DAYS = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
  all: 'all',
};

const MAX_ADAPTIVE_LOOKBACK_DAYS = 7;
const MAX_HISTORY_DAYS = 400;
const PATH_CHUNK_SIZE = 300;

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function normalizePathname(pathname) {
  const trimmed = String(pathname || '').trim();
  if (!trimmed) return '/';
  const pathWithoutHash = trimmed.split('#')[0] || trimmed;
  const pathWithoutQuery = pathWithoutHash.split('?')[0] || pathWithoutHash;
  const withLeadingSlash = pathWithoutQuery.startsWith('/')
    ? pathWithoutQuery
    : `/${pathWithoutQuery}`;

  if (withLeadingSlash === '/') return '/';
  return withLeadingSlash.replace(/\/+$/, '') || '/';
}

function normalizeLabel(value, fallback) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : fallback;
}

function isLikely404Path(pathname) {
  const normalized = normalizePathname(pathname).toLowerCase();
  return (
    normalized === '/404' ||
    normalized.startsWith('/404/') ||
    normalized.includes('/_not-found') ||
    normalized.includes('/not-found')
  );
}

function dateKeyFromDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function extractRedirectTargetFromHtml(html) {
  const text = String(html ?? '');
  const redirectMatch =
    /NEXT_REDIRECT;(?:replace|push);([^;]+);\d{3};/.exec(text);

  if (!redirectMatch?.[1]) return null;

  const normalizedTarget = normalizePathname(redirectMatch[1]);
  if (isLikely404Path(normalizedTarget)) return null;
  return normalizedTarget;
}

function collectPathInventoryFromOut(outDir) {
  if (!existsSync(outDir)) {
    return { validPaths: [], aliases: {} };
  }

  const validPathSet = new Set();
  const aliasMap = new Map();

  function walk(currentDir) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.html')) continue;

      const relFile = path.relative(outDir, full).replace(/\\/g, '/');
      const relDir = path.dirname(relFile).replace(/\\/g, '/');
      const baseName = path.basename(relFile).toLowerCase();

      const routePath =
        baseName === 'index.html'
          ? normalizePathname(relDir === '.' ? '/' : `/${relDir}`)
          : normalizePathname(`/${relFile.replace(/\.html$/i, '')}`);

      if (isLikely404Path(routePath) || baseName.includes('404')) {
        continue;
      }

      const html = readFileSync(full, 'utf8');
      const redirectTarget = extractRedirectTargetFromHtml(html);

      if (redirectTarget && redirectTarget !== routePath) {
        aliasMap.set(routePath, redirectTarget);
        validPathSet.add(redirectTarget);
        continue;
      }

      validPathSet.add(routePath);
    }
  }

  walk(outDir);

  return {
    validPaths: [...validPathSet].sort((a, b) => a.localeCompare(b)),
    aliases: Object.fromEntries(
      [...aliasMap.entries()].sort(([left], [right]) => left.localeCompare(right)),
    ),
  };
}

function splitIntoChunks(values, chunkSize) {
  const output = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    output.push(values.slice(index, index + chunkSize));
  }
  return output;
}

function expandPathVariants(paths) {
  return [
    ...new Set(
      paths.flatMap((pathname) => {
        const normalized = normalizePathname(pathname);
        if (normalized === '/') return ['/'];
        return [normalized, `${normalized}/`];
      }),
    ),
  ];
}

async function queryCloudflareGraphQL(query, variables) {
  const response = await fetch(CLOUDFLARE_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudflare GraphQL error (${response.status}): ${text}`);
  }

  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(`Cloudflare GraphQL query failed: ${JSON.stringify(json.errors)}`);
  }

  return json?.data;
}

async function fetchTotalVisitsForDay({ start, end }) {
  const query = `
    query($zoneTag: string!, $start: Time!, $end: Time!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequestsAdaptiveGroups(
            limit: 100
            filter: {
              datetime_geq: $start
              datetime_lt: $end
            }
          ) {
            sum {
              visits
            }
          }
        }
      }
    }
  `;

  const data = await queryCloudflareGraphQL(query, {
    zoneTag: CLOUDFLARE_ZONE_TAG,
    start,
    end,
  });

  const rows = data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups;
  if (!Array.isArray(rows) || rows.length === 0) {
    return 0;
  }

  return rows.reduce((sum, row) => sum + toNumber(row?.sum?.visits), 0);
}

async function fetchDimensionVisitsByPaths({ start, end, paths, dimension }) {
  const query = `
    query($zoneTag: string!, $start: Time!, $end: Time!, $paths: [string!]) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequestsAdaptiveGroups(
            limit: 9999
            orderBy: [count_DESC]
            filter: {
              datetime_geq: $start
              datetime_lt: $end
              clientRequestPath_in: $paths
            }
          ) {
            dimensions {
              ${dimension}
            }
            sum {
              visits
            }
          }
        }
      }
    }
  `;

  const result = new Map();
  const expanded = expandPathVariants(paths);
  const chunks = splitIntoChunks(expanded, PATH_CHUNK_SIZE);

  for (const chunk of chunks) {
    const data = await queryCloudflareGraphQL(query, {
      zoneTag: CLOUDFLARE_ZONE_TAG,
      start,
      end,
      paths: chunk,
    });

    const rows = data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups;
    if (!Array.isArray(rows)) continue;

    for (const row of rows) {
      const label = row?.dimensions?.[dimension];
      const visits = toNumber(row?.sum?.visits);
      if (visits <= 0) continue;

      const prev = result.get(label) ?? 0;
      result.set(label, prev + visits);
    }
  }

  return result;
}

function mapToObject(map) {
  const output = {};
  for (const [key, value] of map.entries()) {
    output[key] = toNumber(value);
  }
  return output;
}

function objectToMap(value) {
  const map = new Map();
  if (!value || typeof value !== 'object') return map;

  for (const [key, num] of Object.entries(value)) {
    map.set(key, toNumber(num));
  }

  return map;
}

function normalizeMetricMap({ map, normalizer, fallback, validPathSet }) {
  const output = new Map();
  for (const [key, value] of map.entries()) {
    const normalized = normalizer(key, fallback);
    if (!normalized) continue;

    if (validPathSet && !validPathSet.has(normalized)) continue;
    if (isLikely404Path(normalized)) continue;

    const prev = output.get(normalized) ?? 0;
    output.set(normalized, prev + toNumber(value));
  }

  return output;
}

function resolveCanonicalPath(pathname, aliasesMap) {
  let current = normalizePathname(pathname);
  let safetyCounter = 0;

  while (aliasesMap.has(current) && safetyCounter < 10) {
    const nextPath = normalizePathname(aliasesMap.get(current));
    if (!nextPath || nextPath === current) break;
    current = nextPath;
    safetyCounter += 1;
  }

  return current;
}

function emptyDaySnapshot() {
  return {
    totals: { visits: 0 },
    pages: {},
    countries: {},
    browsers: {},
    operatingSystems: {},
    devices: {},
    screenSizes: {},
  };
}

function normalizeHistory(raw) {
  if (raw && typeof raw === 'object' && raw.version === 2 && raw.days && typeof raw.days === 'object') {
    return raw;
  }

  return { version: 2, days: {} };
}

function pruneHistory(history, maxDays = MAX_HISTORY_DAYS) {
  const keys = Object.keys(history.days).sort((a, b) => b.localeCompare(a));
  const keep = new Set(keys.slice(0, maxDays));
  for (const key of keys) {
    if (!keep.has(key)) delete history.days[key];
  }
}

function aggregateHistoryMaps({ history, dayKeys, key }) {
  const output = new Map();

  for (const dayKey of dayKeys) {
    const day = history.days[dayKey];
    if (!day) continue;
    const map = objectToMap(day[key]);

    for (const [name, value] of map.entries()) {
      const prev = output.get(name) ?? 0;
      output.set(name, prev + value);
    }
  }

  return output;
}

function buildPeriodDayKeys(history, days) {
  const keys = Object.keys(history.days).sort((a, b) => b.localeCompare(a));
  if (days === 'all') return keys;
  return keys.slice(0, days);
}

function buildPeriodRecordFromMaps({ periodMaps, entity }) {
  return {
    '1d': toNumber(periodMaps['1d']?.get(entity) ?? 0),
    '7d': toNumber(periodMaps['7d']?.get(entity) ?? 0),
    '30d': toNumber(periodMaps['30d']?.get(entity) ?? 0),
    all: toNumber(periodMaps['all']?.get(entity) ?? 0),
  };
}

function normalizeDeviceLabel(label) {
  const value = normalizeLabel(label, 'Unknown').toLowerCase();
  if (value === 'desktop') return 'Desktop';
  if (value === 'mobile') return 'Mobile';
  if (value === 'tablet') return 'Tablet';
  if (value === 'smarttv') return 'Smart TV';
  return normalizeLabel(label, 'Unknown');
}

function toCountryName(countryOrCode) {
  const value = String(countryOrCode || '').trim();
  if (!value) return 'Unknown';
  if (/^[A-Za-z]{2}$/.test(value)) {
    try {
      const names = new Intl.DisplayNames(['en'], { type: 'region' });
      return names.of(value.toUpperCase()) || value.toUpperCase();
    } catch {
      return value.toUpperCase();
    }
  }
  return value;
}

function updateSnapshotMeta(existingMeta) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const hh = String(now.getUTCHours()).padStart(2, '0');
  const mi = String(now.getUTCMinutes()).padStart(2, '0');

  return {
    ...existingMeta,
    generatedAt: now.toISOString(),
    snapshotLabel: `${yyyy}-${mm}-${dd} ${hh}:${mi} UTC`,
  };
}

async function fetchDaySnapshot({ start, end, validPaths, aliases }) {
  const validPathSet = new Set(validPaths);
  const aliasesMap = new Map(
    Object.entries(aliases ?? {}).map(([key, value]) => [
      normalizePathname(key),
      normalizePathname(value),
    ]),
  );

  const [totalVisits, pagesRaw, countriesRaw, browsersRaw, operatingSystemsRaw, devicesRaw] =
    await Promise.all([
      fetchTotalVisitsForDay({ start, end }),
      fetchDimensionVisitsByPaths({ start, end, paths: validPaths, dimension: 'clientRequestPath' }),
      fetchDimensionVisitsByPaths({ start, end, paths: validPaths, dimension: 'clientCountryName' }),
      fetchDimensionVisitsByPaths({ start, end, paths: validPaths, dimension: 'userAgentBrowser' }),
      fetchDimensionVisitsByPaths({ start, end, paths: validPaths, dimension: 'userAgentOS' }),
      fetchDimensionVisitsByPaths({ start, end, paths: validPaths, dimension: 'clientDeviceType' }),
    ]);

  const pages = normalizeMetricMap({
    map: pagesRaw,
    normalizer: (key) =>
      resolveCanonicalPath(normalizePathname(key), aliasesMap),
    validPathSet,
  });

  const countries = normalizeMetricMap({
    map: countriesRaw,
    normalizer: (key) => normalizeLabel(key, 'Unknown'),
    fallback: 'Unknown',
  });

  const browsers = normalizeMetricMap({
    map: browsersRaw,
    normalizer: (key) => normalizeLabel(key, 'Unknown'),
    fallback: 'Unknown',
  });

  const operatingSystems = normalizeMetricMap({
    map: operatingSystemsRaw,
    normalizer: (key) => normalizeLabel(key, 'Unknown'),
    fallback: 'Unknown',
  });

  const devices = normalizeMetricMap({
    map: devicesRaw,
    normalizer: (key) => normalizeLabel(key, 'Unknown'),
    fallback: 'Unknown',
  });

  return {
    totals: { visits: toNumber(totalVisits) },
    pages: mapToObject(pages),
    countries: mapToObject(countries),
    browsers: mapToObject(browsers),
    operatingSystems: mapToObject(operatingSystems),
    devices: mapToObject(devices),
    screenSizes: {},
  };
}

async function main() {
  ensureDir(ANALYTICS_DIR);

  const inventory = collectPathInventoryFromOut(WEBSITE_PATH_SOURCE_DIR);

  const rawAliases =
    Object.keys(inventory.aliases).length > 0
      ? inventory.aliases
      : readJson(PATH_ALIASES_FILE, {});
  const aliases = Object.fromEntries(
    Object.entries(rawAliases ?? {})
      .map(([aliasPath, destinationPath]) => [
        normalizePathname(aliasPath),
        normalizePathname(destinationPath),
      ])
      .filter(
        ([aliasPath, destinationPath]) =>
          aliasPath.length > 0 &&
          destinationPath.length > 0 &&
          !isLikely404Path(aliasPath) &&
          !isLikely404Path(destinationPath) &&
          aliasPath !== destinationPath,
      )
      .sort(([left], [right]) => left.localeCompare(right)),
  );

  const collectedPaths = inventory.validPaths;
  const fallbackPaths = readJson(VALID_PATHS_FILE, []).map(normalizePathname);
  const basePaths = collectedPaths.length > 0 ? collectedPaths : fallbackPaths;

  const validPathSet = new Set(
    basePaths.filter((pathname) => pathname.length > 0 && !isLikely404Path(pathname)),
  );

  for (const [aliasPath, destinationPath] of Object.entries(aliases)) {
    validPathSet.delete(aliasPath);
    validPathSet.add(destinationPath);
  }

  const validPaths = [...validPathSet].sort((a, b) => a.localeCompare(b));

  if (validPaths.length === 0) {
    throw new Error('No valid paths found for website analytics generation.');
  }

  writeJson(VALID_PATHS_FILE, validPaths);
  writeJson(PATH_ALIASES_FILE, aliases);

  const hasCloudflareCreds = Boolean(CLOUDFLARE_ZONE_TAG && CLOUDFLARE_API_TOKEN);
  const existingMeta = readJson(SNAPSHOT_META_FILE, {});

  if (!hasCloudflareCreds) {
    console.warn(
      '[website-analytics] Missing Cloudflare credentials (CLOUDFLARE_ZONE_TAG/CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN/CLOUDFLARE_TOKEN/CF_API_TOKEN). Refetch skipped.',
    );
    writeJson(SNAPSHOT_META_FILE, updateSnapshotMeta(existingMeta));
    return;
  }

  const rawHistory = readJson(DAILY_HISTORY_FILE, { version: 2, days: {} });
  const history = normalizeHistory(rawHistory);

  console.log('[website-analytics] Refreshing recent daily slices...');

  const now = new Date();
  for (let offset = 0; offset < MAX_ADAPTIVE_LOOKBACK_DAYS; offset += 1) {
    const end = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    const dayKey = dateKeyFromDate(end);

    const snapshot = await fetchDaySnapshot({
      start: start.toISOString(),
      end: end.toISOString(),
      validPaths,
      aliases,
    });

    history.days[dayKey] = { ...emptyDaySnapshot(), ...snapshot };
  }

  pruneHistory(history);
  writeJson(DAILY_HISTORY_FILE, history);

  const periodDayKeys = {
    '1d': buildPeriodDayKeys(history, PERIOD_DAYS['1d']),
    '7d': buildPeriodDayKeys(history, PERIOD_DAYS['7d']),
    '30d': buildPeriodDayKeys(history, PERIOD_DAYS['30d']),
    all: buildPeriodDayKeys(history, PERIOD_DAYS['all']),
  };

  const pagesPeriodMaps = {
    '1d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['1d'], key: 'pages' }),
    '7d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['7d'], key: 'pages' }),
    '30d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['30d'], key: 'pages' }),
    all: aggregateHistoryMaps({ history, dayKeys: periodDayKeys['all'], key: 'pages' }),
  };

  const countryPeriodMaps = {
    '1d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['1d'], key: 'countries' }),
    '7d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['7d'], key: 'countries' }),
    '30d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['30d'], key: 'countries' }),
    all: aggregateHistoryMaps({ history, dayKeys: periodDayKeys['all'], key: 'countries' }),
  };

  const browserPeriodMaps = {
    '1d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['1d'], key: 'browsers' }),
    '7d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['7d'], key: 'browsers' }),
    '30d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['30d'], key: 'browsers' }),
    all: aggregateHistoryMaps({ history, dayKeys: periodDayKeys['all'], key: 'browsers' }),
  };

  const operatingSystemPeriodMaps = {
    '1d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['1d'], key: 'operatingSystems' }),
    '7d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['7d'], key: 'operatingSystems' }),
    '30d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['30d'], key: 'operatingSystems' }),
    all: aggregateHistoryMaps({ history, dayKeys: periodDayKeys['all'], key: 'operatingSystems' }),
  };

  const devicePeriodMaps = {
    '1d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['1d'], key: 'devices' }),
    '7d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['7d'], key: 'devices' }),
    '30d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['30d'], key: 'devices' }),
    all: aggregateHistoryMaps({ history, dayKeys: periodDayKeys['all'], key: 'devices' }),
  };

  const screenSizePeriodMaps = {
    '1d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['1d'], key: 'screenSizes' }),
    '7d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['7d'], key: 'screenSizes' }),
    '30d': aggregateHistoryMaps({ history, dayKeys: periodDayKeys['30d'], key: 'screenSizes' }),
    all: aggregateHistoryMaps({ history, dayKeys: periodDayKeys['all'], key: 'screenSizes' }),
  };

  const pages = validPaths
    .map((routePath) => {
      const metrics = buildPeriodRecordFromMaps({ periodMaps: pagesPeriodMaps, entity: routePath });
      return {
        path: routePath,
        pageviews: metrics,
        visitors: { ...metrics },
        entrances: { ...metrics },
      };
    })
    .sort((a, b) => b.pageviews.all - a.pageviews.all);

  const existingCountries = readJson(COUNTRIES_FILE, []);
  const countryCodeMap = new Map();
  for (const country of existingCountries) {
    const name = normalizeLabel(country?.country, '');
    const code = normalizeLabel(country?.countryCode, '');
    if (name && /^[A-Za-z]{2}$/.test(code)) {
      countryCodeMap.set(name, code.toUpperCase());
    }
  }

  const countryEntities = [...new Set([...countryPeriodMaps.all.keys(), ...countryPeriodMaps['30d'].keys()])];
  const countries = countryEntities
    .map((countryRaw) => {
      const metrics = buildPeriodRecordFromMaps({ periodMaps: countryPeriodMaps, entity: countryRaw });
      const rawText = normalizeLabel(countryRaw, 'Unknown');
      const isCode = /^[A-Za-z]{2}$/.test(rawText);
      const countryCode = isCode ? rawText.toUpperCase() : countryCodeMap.get(rawText);
      const country = toCountryName(rawText);
      return {
        country,
        countryCode,
        pageviews: metrics,
        visitors: { ...metrics },
      };
    })
    .sort((a, b) => b.visitors.all - a.visitors.all);

  function buildTechRows(periodMaps, key) {
    return [...periodMaps.all.entries()]
      .map(([label]) => {
        const resolvedLabel = key === 'device' ? normalizeDeviceLabel(label) : normalizeLabel(label, 'Unknown');
        return {
          [key]: resolvedLabel,
          visits: buildPeriodRecordFromMaps({ periodMaps, entity: label }),
        };
      })
      .sort((a, b) => b.visits.all - a.visits.all);
  }

  const browsers = buildTechRows(browserPeriodMaps, 'browser');
  const operatingSystems = buildTechRows(operatingSystemPeriodMaps, 'os');
  const devices = buildTechRows(devicePeriodMaps, 'device');
  const screenSizes = buildTechRows(screenSizePeriodMaps, 'size');

  const orderedDayKeys = Object.keys(history.days).sort((a, b) => a.localeCompare(b));
  const timeseries = orderedDayKeys.map((dayKey) => {
    const visits = toNumber(history.days?.[dayKey]?.totals?.visits);
    return {
      date: dayKey,
      pageviews: visits,
      visitors: visits,
    };
  });

  const totalVisits = timeseries.reduce((sum, row) => sum + row.visitors, 0);
  const topPage = pages[0];
  const topCountry = countries[0];
  const topDevice = devices[0];

  const summary = {
    pageviews: totalVisits,
    visitors: totalVisits,
    topPage: topPage?.path ?? '/',
    topPageViews: topPage?.pageviews?.all ?? 0,
    topCountry: topCountry?.country ?? 'Unknown',
    topCountryVisitors: topCountry?.visitors?.all ?? 0,
    topDevice: topDevice?.device ?? 'Unknown',
    topDeviceVisitors: topDevice?.visits?.all ?? 0,
  };

  writeJson(PAGES_FILE, pages);
  writeJson(COUNTRIES_FILE, countries);
  writeJson(BROWSERS_FILE, browsers);
  writeJson(OPERATING_SYSTEMS_FILE, operatingSystems);
  writeJson(DEVICES_FILE, devices);
  writeJson(SCREEN_SIZES_FILE, screenSizes);
  writeJson(TIMESERIES_FILE, timeseries);
  writeJson(SUMMARY_FILE, summary);
  writeJson(SNAPSHOT_META_FILE, updateSnapshotMeta(existingMeta));

  console.log(
    `[website-analytics] Generated ${pages.length} pages, ${countries.length} countries. Total last-year visits: ${totalVisits}.`,
  );
}

main().catch((error) => {
  console.error('[website-analytics] Generation failed.', error);
  process.exitCode = 1;
});
