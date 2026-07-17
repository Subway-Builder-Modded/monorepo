import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  existsSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { Buffer } from "node:buffer";
import {
  REGISTRY_REPO,
  REGISTRY_REF,
  REGISTRY_MAP_DATA_REF,
  assertNoProhibitedGeneratedRegistryAssets,
  transformRegistryListingManifest,
} from "./registry-site-data-materializer.mjs";

const LOCAL_ENV_FILES = [".env", ".env.local"];
const MAP_DATA_MATERIALIZED_FILE_NAMES = new Set(["grid.geojson"]);
const REGISTRY_COLLECTIONS = ["maps", "mods"];
const REGISTRY_COLLECTION_FILES = ["index.json", "downloads.json", "integrity.json"];
const AUTHOR_CACHE_FILES = ["index.json"];
const CREDIT_CACHE_FILES = ["maintainers.json", "supporters.json"];

const WEBSITE_PERIODS = ["1d", "7d", "30d", "all"];
const WEBSITE_PERIOD_DAYS = {
  "1d": 1,
  "7d": 7,
  "30d": 30,
  all: Number.POSITIVE_INFINITY,
};

const COPY_MAPPINGS = [
  {
    source: "docs/terms-of-service.mdx",
    destination: "public/registry-cache/docs/terms-of-service.mdx",
  },
  {
    source: "analytics/most_popular_all_time.csv",
    destination: "public/registry-cache/analytics/most_popular_all_time.csv",
  },
  {
    source: "analytics/most_popular_last_1d.csv",
    destination: "public/registry-cache/analytics/most_popular_last_1d.csv",
  },
  {
    source: "analytics/most_popular_last_3d.csv",
    destination: "public/registry-cache/analytics/most_popular_last_3d.csv",
  },
  {
    source: "analytics/most_popular_last_7d.csv",
    destination: "public/registry-cache/analytics/most_popular_last_7d.csv",
  },
  {
    source: "analytics/authors_by_total_downloads.csv",
    destination: "public/registry-cache/analytics/authors_by_total_downloads.csv",
  },
  {
    source: "analytics/projects_most_popular_all_time.csv",
    destination: "public/registry-cache/analytics/projects_most_popular_all_time.csv",
  },
  {
    source: "analytics/projects_most_popular_last_1d.csv",
    destination: "public/registry-cache/analytics/projects_most_popular_last_1d.csv",
  },
  {
    source: "analytics/projects_most_popular_last_3d.csv",
    destination: "public/registry-cache/analytics/projects_most_popular_last_3d.csv",
  },
  {
    source: "analytics/projects_most_popular_last_7d.csv",
    destination: "public/registry-cache/analytics/projects_most_popular_last_7d.csv",
  },
  {
    source: "analytics/listing_projects.csv",
    destination: "public/registry-cache/analytics/listing_projects.csv",
  },
  {
    source: "analytics/maps_statistics.csv",
    destination: "public/registry-cache/analytics/maps_statistics.csv",
  },
  {
    source: "analytics/assets_by_day.csv",
    destination: "public/registry-cache/analytics/assets_by_day.csv",
  },
  {
    source: "analytics/most_popular_by_day.csv",
    destination: "public/registry-cache/analytics/most_popular_by_day.csv",
  },
  {
    source: "analytics/authors_by_day.csv",
    destination: "public/registry-cache/analytics/authors_by_day.csv",
  },
  {
    source: "analytics/discord_server_by_day.csv",
    destination: "public/community/discord_server_by_day.csv",
  },
  {
    source: "analytics/discord_user_message_by_day.csv",
    destination: "public/community/discord_user_message_by_day.csv",
  },
  {
    source: "authors/index.json",
    destination: "public/registry-cache/analytics/authors_index.json",
  },
  {
    source: "analytics/railyard_app_downloads.json",
    destination: "public/railyard/analytics/railyard_app_downloads.json",
  },
  {
    source: "analytics/railyard_app_by_day.csv",
    destination: "public/railyard/analytics/railyard_app_by_day.csv",
  },
  {
    source: "history/railyard_app_downloads.json",
    destination: "public/railyard/analytics/railyard_app_downloads_history.json",
  },
];

const FETCH_STEPS = [
  "Load local environment",
  "Validate GitHub token",
  "Fetch registry snapshot",
  "Fetch map data snapshot",
  "Clean generated registry cache",
  "Copy registry, railyard, and community artifacts",
  "Materialize registry metadata",
  "Materialize map grid data",
  "Build release cache",
  "Transform website analytics",
  "Write website artifacts",
  "Validate generated registry cache",
  "Write metadata",
];

function fail(message) {
  throw new Error(`[fetch-registry-site-data] ${message}`);
}

function createProgressTracker(steps) {
  let currentStep = 0;

  return {
    step(label) {
      currentStep += 1;
      console.log(`[fetch-registry-site-data] [${currentStep}/${steps.length}] ${label}`);
    },
    detail(message) {
      console.log(`[fetch-registry-site-data]     ${message}`);
    },
  };
}

function runGit(args, options = {}) {
  const result = spawnSync("git", args, {
    stdio: "pipe",
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: "0",
      GCM_INTERACTIVE: "Never",
    },
    ...options,
  });

  if (result.error) {
    fail(`failed to run git: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    fail(`git ${args.join(" ")} failed${stderr ? `: ${stderr}` : stdout ? `: ${stdout}` : ""}`);
  }

  return result.stdout?.trim() ?? "";
}

function cloneRegistryRef(ref, cloneDir, basicAuthHeader) {
  runGit([
    "-c",
    `http.extraheader=AUTHORIZATION: basic ${basicAuthHeader}`,
    "-c",
    "credential.helper=",
    "clone",
    "--depth",
    "1",
    "--branch",
    ref,
    `https://github.com/${REGISTRY_REPO}.git`,
    cloneDir,
  ]);

  return runGit(["-C", cloneDir, "rev-parse", "HEAD"]);
}

function ensureDirForFile(filePath) {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function parseDotEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const withoutExport = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
  const separator = withoutExport.indexOf("=");
  if (separator <= 0) return null;

  const key = withoutExport.slice(0, separator).trim();
  let value = withoutExport.slice(separator + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

function loadLocalEnvFiles(workspaceRoot) {
  for (const fileName of LOCAL_ENV_FILES) {
    const filePath = path.join(workspaceRoot, fileName);
    if (!existsSync(filePath)) continue;

    const contents = readFileSync(filePath, "utf8");
    const lines = contents.split(/\r?\n/);
    for (const line of lines) {
      const parsed = parseDotEnvLine(line);
      if (!parsed) continue;
      if (process.env[parsed.key] === undefined) {
        process.env[parsed.key] = parsed.value;
      }
    }
  }
}

function writeJson(filePath, value) {
  ensureDirForFile(filePath);
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function getFileSize(filePath) {
  return statSync(filePath).size;
}

function countFiles(rootPath) {
  if (!existsSync(rootPath)) {
    return 0;
  }

  let count = 0;
  const stack = [rootPath];
  while (stack.length > 0) {
    const current = stack.pop() ?? rootPath;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile()) {
        count += 1;
      }
    }
  }
  return count;
}

function collectFiles(rootPath, relativePrefix) {
  if (!existsSync(rootPath)) {
    return [];
  }

  const files = [];
  const stack = [rootPath];
  while (stack.length > 0) {
    const current = stack.pop() ?? rootPath;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile()) {
        files.push(
          path.posix.join(relativePrefix, path.relative(rootPath, entryPath).replace(/\\/g, "/")),
        );
      }
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
}

function writeMaterializedJson(relativePath, value, workspaceRoot, materializedFiles, stats) {
  const destinationPath = path.join(workspaceRoot, relativePath);
  writeJson(destinationPath, value);
  materializedFiles.push(relativePath);
  stats.localMetadataBytes += getFileSize(destinationPath);
}

function copyMaterializedFile(
  sourcePath,
  relativePath,
  workspaceRoot,
  materializedFiles,
  stats,
  byteBucket = "localMetadataBytes",
) {
  const destinationPath = path.join(workspaceRoot, relativePath);
  ensureDirForFile(destinationPath);
  copyFileSync(sourcePath, destinationPath);
  materializedFiles.push(relativePath);
  stats[byteBucket] += getFileSize(destinationPath);
}

function sumValues(target, valuesByKey) {
  for (const [key, value] of Object.entries(valuesByKey ?? {})) {
    const next = Number(value);
    if (!Number.isFinite(next)) continue;
    target.set(key, (target.get(key) ?? 0) + next);
  }
}

function buildPeriods(snapshotEntries) {
  return WEBSITE_PERIODS.map((period) => {
    const days = WEBSITE_PERIOD_DAYS[period];
    const entries = Number.isFinite(days)
      ? snapshotEntries.slice(Math.max(snapshotEntries.length - days, 0))
      : snapshotEntries;
    return { period, entries };
  });
}

function makePeriodMetrics(aggregatesByPeriod, key) {
  const metrics = {};
  for (const period of WEBSITE_PERIODS) {
    metrics[period] = aggregatesByPeriod[period]?.get(key) ?? 0;
  }
  return metrics;
}

function parseWebsiteAnalytics(websiteAnalytics) {
  const snapshots = websiteAnalytics?.snapshots;
  if (!snapshots || typeof snapshots !== "object") {
    fail("registry file analytics/website_analytics.json is missing snapshots");
  }

  const snapshotEntries = Object.entries(snapshots)
    .filter(
      ([dateKey, payload]) =>
        /^\d{4}-\d{2}-\d{2}$/.test(dateKey) && payload && typeof payload === "object",
    )
    .map(([dateKey, payload]) => ({ dateKey, payload }))
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey));

  if (snapshotEntries.length === 0) {
    fail("registry file analytics/website_analytics.json does not contain any dated snapshots");
  }

  const periodBuckets = buildPeriods(snapshotEntries);

  const pageByPeriod = {};
  const countryByPeriod = {};
  const browserByPeriod = {};
  const operatingSystemByPeriod = {};
  const deviceByPeriod = {};
  const totalsByPeriod = {};

  for (const { period, entries } of periodBuckets) {
    const pageCounts = new Map();
    const countryCounts = new Map();
    const browserCounts = new Map();
    const operatingSystemCounts = new Map();
    const deviceCounts = new Map();
    let totalVisits = 0;

    for (const entry of entries) {
      const payload = entry.payload;
      totalVisits += Number(payload?.totals?.visits ?? 0) || 0;
      sumValues(pageCounts, payload?.pages);
      sumValues(countryCounts, payload?.countries);
      sumValues(browserCounts, payload?.browsers);
      sumValues(operatingSystemCounts, payload?.operating_systems);
      sumValues(deviceCounts, payload?.devices);
    }

    pageByPeriod[period] = pageCounts;
    countryByPeriod[period] = countryCounts;
    browserByPeriod[period] = browserCounts;
    operatingSystemByPeriod[period] = operatingSystemCounts;
    deviceByPeriod[period] = deviceCounts;
    totalsByPeriod[period] = totalVisits;
  }

  const allPages = new Set();
  const allCountries = new Set();
  const allBrowsers = new Set();
  const allOperatingSystems = new Set();
  const allDevices = new Set();

  for (const period of WEBSITE_PERIODS) {
    for (const key of pageByPeriod[period].keys()) allPages.add(key);
    for (const key of countryByPeriod[period].keys()) allCountries.add(key);
    for (const key of browserByPeriod[period].keys()) allBrowsers.add(key);
    for (const key of operatingSystemByPeriod[period].keys()) allOperatingSystems.add(key);
    for (const key of deviceByPeriod[period].keys()) allDevices.add(key);
  }

  const validPaths = Array.isArray(websiteAnalytics.valid_paths)
    ? websiteAnalytics.valid_paths.filter((value) => typeof value === "string")
    : [];
  const pathAliases =
    websiteAnalytics.path_aliases && typeof websiteAnalytics.path_aliases === "object"
      ? websiteAnalytics.path_aliases
      : {};

  for (const pathValue of validPaths) {
    allPages.add(pathValue);
  }

  const countryNameLookup = new Intl.DisplayNames(["en"], { type: "region" });

  const pages = [...allPages]
    .sort(
      (left, right) =>
        (pageByPeriod.all.get(right) ?? 0) - (pageByPeriod.all.get(left) ?? 0) ||
        left.localeCompare(right),
    )
    .map((pagePath) => ({
      path: pagePath,
      pageviews: makePeriodMetrics(pageByPeriod, pagePath),
      visitors: makePeriodMetrics(pageByPeriod, pagePath),
      entrances: makePeriodMetrics(pageByPeriod, pagePath),
    }));

  const countries = [...allCountries]
    .sort(
      (left, right) =>
        (countryByPeriod.all.get(right) ?? 0) - (countryByPeriod.all.get(left) ?? 0) ||
        left.localeCompare(right),
    )
    .map((countryCode) => {
      const normalizedCode = String(countryCode).toUpperCase();
      const resolvedName = /^[A-Z]{2}$/.test(normalizedCode)
        ? countryNameLookup.of(normalizedCode) || normalizedCode
        : String(countryCode);
      return {
        country: resolvedName,
        countryCode: /^[A-Z]{2}$/.test(normalizedCode) ? normalizedCode : undefined,
        pageviews: makePeriodMetrics(countryByPeriod, countryCode),
        visitors: makePeriodMetrics(countryByPeriod, countryCode),
      };
    });

  const browsers = [...allBrowsers]
    .sort(
      (left, right) =>
        (browserByPeriod.all.get(right) ?? 0) - (browserByPeriod.all.get(left) ?? 0) ||
        left.localeCompare(right),
    )
    .map((browser) => ({
      browser,
      visits: makePeriodMetrics(browserByPeriod, browser),
    }));

  const operatingSystems = [...allOperatingSystems]
    .sort(
      (left, right) =>
        (operatingSystemByPeriod.all.get(right) ?? 0) -
          (operatingSystemByPeriod.all.get(left) ?? 0) || left.localeCompare(right),
    )
    .map((operatingSystem) => ({
      operatingSystem,
      visits: makePeriodMetrics(operatingSystemByPeriod, operatingSystem),
    }));

  const devices = [...allDevices]
    .sort(
      (left, right) =>
        (deviceByPeriod.all.get(right) ?? 0) - (deviceByPeriod.all.get(left) ?? 0) ||
        left.localeCompare(right),
    )
    .map((device) => ({
      device,
      visits: makePeriodMetrics(deviceByPeriod, device),
    }));

  const timeSeries = snapshotEntries.map((entry) => ({
    date: entry.dateKey,
    pageviews: Number(entry.payload?.totals?.visits ?? 0) || 0,
    visitors: Number(entry.payload?.totals?.visits ?? 0) || 0,
  }));

  const dailyHistory = snapshotEntries.map((entry) => ({
    date: entry.dateKey,
    capturedAt: String(entry.payload?.captured_at ?? ""),
    windowStart: String(entry.payload?.window_start ?? ""),
    windowEnd: String(entry.payload?.window_end ?? ""),
    visits: Number(entry.payload?.totals?.visits ?? 0) || 0,
  }));

  const allSummaryTopPage = pages[0]?.path ?? "/";
  const allSummaryTopCountry = countries[0]?.country ?? "Unknown";
  const allSummaryTopDevice = devices[0]?.device ?? "Unknown";

  const summary = {
    pageviews: totalsByPeriod.all ?? 0,
    visitors: totalsByPeriod.all ?? 0,
    topPage: allSummaryTopPage,
    topPageViews: pageByPeriod.all.get(allSummaryTopPage) ?? 0,
    topCountry: allSummaryTopCountry,
    topCountryVisitors: countryByPeriod.all.get(countries[0]?.countryCode ?? "") ?? 0,
    topDevice: allSummaryTopDevice,
    topDeviceVisitors: deviceByPeriod.all.get(allSummaryTopDevice) ?? 0,
  };

  return {
    summary,
    timeseries: timeSeries,
    pages,
    countries,
    browsers,
    operatingSystems,
    devices,
    validPaths,
    pathAliases,
    dailyHistory,
    sourceGeneratedAt: String(websiteAnalytics.generated_at ?? ""),
  };
}

function copyMappedFiles(snapshotRoot, workspaceRoot, materializedFiles, progress, stats) {
  for (const [index, mapping] of COPY_MAPPINGS.entries()) {
    const sourcePath = path.join(snapshotRoot, mapping.source);
    if (!existsSync(sourcePath)) {
      fail(`required registry file is missing: ${mapping.source}`);
    }

    copyMaterializedFile(
      sourcePath,
      mapping.destination.replace(/\\/g, "/"),
      workspaceRoot,
      materializedFiles,
      stats,
    );
    progress.detail(`Copied ${index + 1}/${COPY_MAPPINGS.length}: ${mapping.destination}`);
  }
}

function removeGeneratedRegistryCache(workspaceRoot) {
  const cacheRoot = path.join(workspaceRoot, "public", "registry-cache");
  const ownedRoots = ["authors", "credits", "docs", "maps", "mods"].map((dirName) =>
    path.join(cacheRoot, dirName),
  );
  let removedCount = 0;

  for (const root of ownedRoots) {
    removedCount += countFiles(root);
    rmSync(root, { recursive: true, force: true });
  }

  return removedCount;
}

function getListingIds(collectionRootPath, routeSegment) {
  const indexPath = path.join(collectionRootPath, "index.json");
  const integrityPath = path.join(collectionRootPath, "integrity.json");
  const indexData = readJson(indexPath);
  const integrity = readJson(integrityPath);
  const idsFromIndex = Array.isArray(indexData?.[routeSegment]) ? indexData[routeSegment] : [];
  return {
    ids: idsFromIndex.length > 0 ? idsFromIndex : Object.keys(integrity?.listings ?? {}),
    integrity,
  };
}

function hasCompleteVersion(listing) {
  if (!listing) {
    return false;
  }
  if (listing.has_complete_version === true) {
    return true;
  }
  return Object.values(listing.versions ?? {}).some((version) => version?.is_complete === true);
}

function materializeRegistryCollection(
  snapshotRoot,
  workspaceRoot,
  routeSegment,
  commitSha,
  materializedFiles,
  stats,
) {
  const sourceRootPath = path.join(snapshotRoot, routeSegment);
  if (!existsSync(sourceRootPath)) {
    fail(`required registry directory is missing: ${routeSegment}`);
  }

  for (const fileName of REGISTRY_COLLECTION_FILES) {
    const sourcePath = path.join(sourceRootPath, fileName);
    if (!existsSync(sourcePath)) {
      fail(`required registry file is missing: ${routeSegment}/${fileName}`);
    }
    copyMaterializedFile(
      sourcePath,
      path.posix.join("public/registry-cache", routeSegment, fileName),
      workspaceRoot,
      materializedFiles,
      stats,
    );
  }

  const { ids, integrity } = getListingIds(sourceRootPath, routeSegment);
  let manifestCount = 0;

  for (const id of ids) {
    if (!hasCompleteVersion(integrity?.listings?.[id])) {
      continue;
    }

    const sourcePath = path.join(sourceRootPath, id, "manifest.json");
    if (!existsSync(sourcePath)) {
      continue;
    }

    const manifest = readJson(sourcePath);
    if (manifest?.is_test === true) {
      continue;
    }

    const transformed = transformRegistryListingManifest(manifest, {
      commitSha,
      routeSegment,
      id,
    });
    const relativePath = path.posix.join(
      "public/registry-cache",
      routeSegment,
      id,
      "manifest.json",
    );
    writeMaterializedJson(
      relativePath,
      transformed.manifest,
      workspaceRoot,
      materializedFiles,
      stats,
    );
    stats.galleryReferencesRewritten += transformed.rewrittenCount;
    manifestCount += 1;
  }

  return manifestCount;
}

function materializeRegistryMetadata(
  snapshotRoot,
  workspaceRoot,
  commitSha,
  materializedFiles,
  stats,
) {
  const manifestCounts = { maps: 0, mods: 0 };

  for (const fileName of AUTHOR_CACHE_FILES) {
    copyMaterializedFile(
      path.join(snapshotRoot, "authors", fileName),
      path.posix.join("public/registry-cache/authors", fileName),
      workspaceRoot,
      materializedFiles,
      stats,
    );
  }

  for (const fileName of CREDIT_CACHE_FILES) {
    copyMaterializedFile(
      path.join(snapshotRoot, "credits", fileName),
      path.posix.join("public/registry-cache/credits", fileName),
      workspaceRoot,
      materializedFiles,
      stats,
    );
  }

  for (const routeSegment of REGISTRY_COLLECTIONS) {
    manifestCounts[routeSegment] = materializeRegistryCollection(
      snapshotRoot,
      workspaceRoot,
      routeSegment,
      commitSha,
      materializedFiles,
      stats,
    );
  }

  return manifestCounts;
}

function countOmittedGalleryAssets(snapshotRoot) {
  let count = 0;
  let bytes = 0;

  for (const routeSegment of REGISTRY_COLLECTIONS) {
    const sourceRootPath = path.join(snapshotRoot, routeSegment);
    if (!existsSync(sourceRootPath)) continue;

    for (const listing of readdirSync(sourceRootPath, { withFileTypes: true })) {
      if (!listing.isDirectory()) continue;
      const galleryRoot = path.join(sourceRootPath, listing.name, "gallery");
      if (!existsSync(galleryRoot)) continue;
      for (const relativeFile of collectFiles(galleryRoot, "")) {
        const filePath = path.join(galleryRoot, relativeFile);
        count += 1;
        bytes += getFileSize(filePath);
      }
    }
  }

  return { count, bytes };
}

function countOmittedBasemaps(snapshotRoot) {
  const sourceRootPath = path.join(snapshotRoot, "maps");
  if (!existsSync(sourceRootPath)) {
    return 0;
  }

  return readdirSync(sourceRootPath, { withFileTypes: true }).filter(
    (entry) =>
      entry.isDirectory() && existsSync(path.join(sourceRootPath, entry.name, "basemap.svg")),
  ).length;
}

function materializeMapDataArtifacts(
  snapshotRoot,
  workspaceRoot,
  materializedFiles,
  progress,
  stats,
) {
  const sourceRootPath = path.join(snapshotRoot, "maps");
  if (!existsSync(sourceRootPath)) {
    fail("required registry map data directory is missing: maps");
  }

  let copiedCount = 0;
  const entries = readdirSync(sourceRootPath, { withFileTypes: true }).sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    for (const fileName of MAP_DATA_MATERIALIZED_FILE_NAMES) {
      const sourcePath = path.join(sourceRootPath, entry.name, fileName);
      if (!existsSync(sourcePath)) {
        continue;
      }

      const materializedPath = path.posix.join("public/registry-cache/maps", entry.name, fileName);
      copyMaterializedFile(
        sourcePath,
        materializedPath,
        workspaceRoot,
        materializedFiles,
        stats,
        "localGridBytes",
      );
      copiedCount += 1;
    }
  }

  stats.gridFilesRetained += copiedCount;
  progress.detail(`Copied ${copiedCount} ${REGISTRY_MAP_DATA_REF} grid.geojson files`);
}

function validateGeneratedRegistryCache(workspaceRoot) {
  const registryCacheRoot = path.join(workspaceRoot, "public", "registry-cache");
  const files = collectFiles(registryCacheRoot, "public/registry-cache");
  assertNoProhibitedGeneratedRegistryAssets(files);

  const expectedFiles = [
    ...REGISTRY_COLLECTIONS.flatMap((routeSegment) =>
      REGISTRY_COLLECTION_FILES.map((fileName) =>
        path.posix.join("public/registry-cache", routeSegment, fileName),
      ),
    ),
    ...AUTHOR_CACHE_FILES.map((fileName) =>
      path.posix.join("public/registry-cache/authors", fileName),
    ),
    ...CREDIT_CACHE_FILES.map((fileName) =>
      path.posix.join("public/registry-cache/credits", fileName),
    ),
  ];

  for (const relativePath of expectedFiles) {
    if (!existsSync(path.join(workspaceRoot, relativePath))) {
      fail(`expected generated registry cache file is missing: ${relativePath}`);
    }
  }
}

function buildReleaseCache(snapshotRoot, workspaceRoot, materializedFiles, progress, stats) {
  const relativePath = "public/registry-cache/github-releases-cache.json";
  const outputPath = path.join(workspaceRoot, relativePath);
  const result = spawnSync(
    process.execPath,
    [
      "scripts/generate-github-release-cache.mjs",
      "--snapshot-root",
      snapshotRoot,
      "--output",
      outputPath,
    ],
    {
      cwd: workspaceRoot,
      stdio: "pipe",
      encoding: "utf8",
      env: process.env,
    },
  );

  if (result.error) {
    fail(`failed to run release cache generator: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    fail(`release cache generator failed${stderr ? `: ${stderr}` : stdout ? `: ${stdout}` : ""}`);
  }

  materializedFiles.push(relativePath);
  stats.localMetadataBytes += getFileSize(outputPath);
  progress.detail(result.stdout.trim() || `Wrote ${relativePath}`);
}

function writeWebsiteFiles(parsedWebsite, workspaceRoot, materializedFiles, progress, stats) {
  const outputs = {
    "public/website/analytics/summary.json": parsedWebsite.summary,
    "public/website/analytics/timeseries.json": parsedWebsite.timeseries,
    "public/website/analytics/pages.json": parsedWebsite.pages,
    "public/website/analytics/countries.json": parsedWebsite.countries,
    "public/website/analytics/browsers.json": parsedWebsite.browsers,
    "public/website/analytics/operating-systems.json": parsedWebsite.operatingSystems,
    "public/website/analytics/devices.json": parsedWebsite.devices,
    "public/website/analytics/valid-paths.json": parsedWebsite.validPaths,
    "public/website/analytics/path-aliases.json": parsedWebsite.pathAliases,
    "public/website/analytics/daily-history.json": parsedWebsite.dailyHistory,
  };

  const outputEntries = Object.entries(outputs);
  for (const [index, [relativePath, value]] of outputEntries.entries()) {
    const fullPath = path.join(workspaceRoot, relativePath);
    writeJson(fullPath, value);
    materializedFiles.push(relativePath);
    stats.localMetadataBytes += getFileSize(fullPath);
    progress.detail(`Wrote ${index + 1}/${outputEntries.length}: ${relativePath}`);
  }
}

function main() {
  const workspaceRoot = process.cwd();
  const progress = createProgressTracker(FETCH_STEPS);

  progress.step("Load local environment");
  loadLocalEnvFiles(workspaceRoot);

  progress.step("Validate GitHub token");
  const token = process.env.SBM_GITHUB_TOKEN?.trim() || "";

  if (!token) {
    fail("missing GitHub token: set SBM_GITHUB_TOKEN");
  }

  const tempRoot = mkdtempSync(path.join(tmpdir(), "website-registry-"));
  const cloneDir = path.join(tempRoot, "registry");
  const mapDataCloneDir = path.join(tempRoot, "registry-map-data");
  const basicAuthHeader = Buffer.from(`x-access-token:${token}`, "utf8").toString("base64");

  try {
    progress.step("Fetch registry snapshot");
    const commitSha = cloneRegistryRef(REGISTRY_REF, cloneDir, basicAuthHeader);
    progress.detail(`Fetched ${REGISTRY_REPO}@${REGISTRY_REF} (${commitSha})`);

    progress.step("Fetch map data snapshot");
    const mapDataCommitSha = cloneRegistryRef(
      REGISTRY_MAP_DATA_REF,
      mapDataCloneDir,
      basicAuthHeader,
    );
    progress.detail(`Fetched ${REGISTRY_REPO}@${REGISTRY_MAP_DATA_REF} (${mapDataCommitSha})`);

    const fetchedAt = new Date().toISOString();
    const materializedFiles = [];
    const stats = {
      staleGeneratedFilesRemoved: 0,
      mapManifestsWritten: 0,
      modManifestsWritten: 0,
      galleryReferencesRewritten: 0,
      galleryFilesOmitted: 0,
      basemapFilesOmitted: 0,
      gridFilesRetained: 0,
      localMetadataBytes: 0,
      localGridBytes: 0,
      remoteImageBytesOmitted: 0,
    };

    progress.step("Clean generated registry cache");
    stats.staleGeneratedFilesRemoved = removeGeneratedRegistryCache(workspaceRoot);
    progress.detail(
      `Removed ${stats.staleGeneratedFilesRemoved} stale files from generated registry-cache roots`,
    );

    progress.step("Copy registry, railyard, and community artifacts");
    copyMappedFiles(cloneDir, workspaceRoot, materializedFiles, progress, stats);

    const omittedGalleryAssets = countOmittedGalleryAssets(cloneDir);
    stats.galleryFilesOmitted = omittedGalleryAssets.count;
    stats.remoteImageBytesOmitted = omittedGalleryAssets.bytes;
    stats.basemapFilesOmitted = countOmittedBasemaps(mapDataCloneDir);

    progress.step("Materialize registry metadata");
    const manifestCounts = materializeRegistryMetadata(
      cloneDir,
      workspaceRoot,
      commitSha,
      materializedFiles,
      stats,
    );
    stats.mapManifestsWritten = manifestCounts.maps;
    stats.modManifestsWritten = manifestCounts.mods;
    progress.detail(
      `Wrote ${stats.mapManifestsWritten} map manifests and ${stats.modManifestsWritten} mod manifests`,
    );
    progress.detail(`Rewrote ${stats.galleryReferencesRewritten} gallery manifest references`);

    progress.step("Materialize map grid data");
    materializeMapDataArtifacts(mapDataCloneDir, workspaceRoot, materializedFiles, progress, stats);

    progress.step("Build release cache");
    buildReleaseCache(cloneDir, workspaceRoot, materializedFiles, progress, stats);

    const websiteAnalyticsPath = path.join(cloneDir, "analytics", "website_analytics.json");
    if (!existsSync(websiteAnalyticsPath)) {
      fail("required registry file is missing: analytics/website_analytics.json");
    }

    progress.step("Transform website analytics");
    const parsedWebsite = parseWebsiteAnalytics(readJson(websiteAnalyticsPath));
    progress.detail(`Prepared ${parsedWebsite.timeseries.length} daily website analytics points`);

    progress.step("Write website artifacts");
    writeWebsiteFiles(parsedWebsite, workspaceRoot, materializedFiles, progress, stats);

    progress.step("Validate generated registry cache");
    validateGeneratedRegistryCache(workspaceRoot);
    progress.detail("Registry cache validation passed");

    const metadata = {
      sourceRepo: REGISTRY_REPO,
      sourceRef: REGISTRY_REF,
      commitSha,
      mapDataSourceRef: REGISTRY_MAP_DATA_REF,
      mapDataCommitSha,
      fetchedAt,
      materializedFiles: materializedFiles.sort((left, right) => left.localeCompare(right)),
      websiteAnalyticsSourceGeneratedAt: parsedWebsite.sourceGeneratedAt,
    };

    progress.step("Write metadata");
    const metadataPath = path.join(workspaceRoot, "public", "website", "snapshot-meta.json");
    writeJson(metadataPath, metadata);
    progress.detail("Wrote public/website/snapshot-meta.json");

    const registryMetaPath = path.join(
      workspaceRoot,
      "public",
      "registry-cache",
      "analytics",
      "snapshot-meta.json",
    );
    writeJson(registryMetaPath, {
      sourceRepo: REGISTRY_REPO,
      sourceRef: REGISTRY_REF,
      commitSha,
      mapDataSourceRef: REGISTRY_MAP_DATA_REF,
      mapDataCommitSha,
      fetchedAt,
      files: materializedFiles
        .filter((file) => file.startsWith("public/registry-cache/analytics/"))
        .sort((a, b) => a.localeCompare(b)),
    });
    progress.detail("Wrote public/registry-cache/analytics/snapshot-meta.json");

    const railyardMetaPath = path.join(
      workspaceRoot,
      "public",
      "railyard",
      "analytics",
      "snapshot-meta.json",
    );
    writeJson(railyardMetaPath, {
      sourceRepo: REGISTRY_REPO,
      sourceRef: REGISTRY_REF,
      commitSha,
      mapDataSourceRef: REGISTRY_MAP_DATA_REF,
      mapDataCommitSha,
      fetchedAt,
      files: materializedFiles
        .filter((file) => file.startsWith("public/railyard/analytics/"))
        .sort((a, b) => a.localeCompare(b)),
    });
    progress.detail("Wrote public/railyard/analytics/snapshot-meta.json");

    console.log(
      `[fetch-registry-site-data] materialized ${materializedFiles.length} files from ${REGISTRY_REPO}@${REGISTRY_REF} (${commitSha}) and ${REGISTRY_MAP_DATA_REF} (${mapDataCommitSha})`,
    );
    console.log(
      `[fetch-registry-site-data] registry cache: ${stats.mapManifestsWritten} map manifests, ${stats.modManifestsWritten} mod manifests, ${stats.galleryReferencesRewritten} gallery refs rewritten`,
    );
    console.log(
      `[fetch-registry-site-data] omitted local assets: ${stats.galleryFilesOmitted} gallery files (${stats.remoteImageBytesOmitted} bytes), ${stats.basemapFilesOmitted} basemap files`,
    );
    console.log(
      `[fetch-registry-site-data] retained local map data: ${stats.gridFilesRetained} grid files (${stats.localGridBytes} bytes)`,
    );
    console.log(
      `[fetch-registry-site-data] cleanup/materialized: ${stats.staleGeneratedFilesRemoved} stale files removed, ${materializedFiles.length} local files, ${stats.localMetadataBytes} metadata bytes`,
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
