import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  existsSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { Buffer } from "node:buffer";

const REGISTRY_REPO = "Subway-Builder-Modded/registry";
const REGISTRY_REF = "main";
const LOCAL_ENV_FILES = [".env", ".env.local"];

const WEBSITE_PERIODS = ["1d", "7d", "30d", "all"];
const WEBSITE_PERIOD_DAYS = {
  "1d": 1,
  "7d": 7,
  "30d": 30,
  all: Number.POSITIVE_INFINITY,
};

const COPY_MAPPINGS = [
  {
    source: "analytics/most_popular_all_time.csv",
    destination: "public/registry/analytics/most_popular_all_time.csv",
  },
  {
    source: "analytics/most_popular_last_1d.csv",
    destination: "public/registry/analytics/most_popular_last_1d.csv",
  },
  {
    source: "analytics/most_popular_last_3d.csv",
    destination: "public/registry/analytics/most_popular_last_3d.csv",
  },
  {
    source: "analytics/most_popular_last_7d.csv",
    destination: "public/registry/analytics/most_popular_last_7d.csv",
  },
  {
    source: "analytics/authors_by_total_downloads.csv",
    destination: "public/registry/analytics/authors_by_total_downloads.csv",
  },
  {
    source: "analytics/projects_most_popular_all_time.csv",
    destination: "public/registry/analytics/projects_most_popular_all_time.csv",
  },
  {
    source: "analytics/projects_most_popular_last_1d.csv",
    destination: "public/registry/analytics/projects_most_popular_last_1d.csv",
  },
  {
    source: "analytics/projects_most_popular_last_3d.csv",
    destination: "public/registry/analytics/projects_most_popular_last_3d.csv",
  },
  {
    source: "analytics/projects_most_popular_last_7d.csv",
    destination: "public/registry/analytics/projects_most_popular_last_7d.csv",
  },
  {
    source: "analytics/listing_projects.csv",
    destination: "public/registry/analytics/listing_projects.csv",
  },
  {
    source: "analytics/maps_statistics.csv",
    destination: "public/registry/analytics/maps_statistics.csv",
  },
  {
    source: "analytics/assets_by_day.csv",
    destination: "public/registry/analytics/assets_by_day.csv",
  },
  {
    source: "analytics/most_popular_by_day.csv",
    destination: "public/registry/analytics/most_popular_by_day.csv",
  },
  {
    source: "analytics/authors_by_day.csv",
    destination: "public/registry/analytics/authors_by_day.csv",
  },
  { source: "authors/index.json", destination: "public/registry/analytics/authors_index.json" },
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

const MIRROR_DIRECTORY_MAPPINGS = [
  { sourceRoot: "authors", destinationRoot: "public/registry/authors" },
  { sourceRoot: "maps", destinationRoot: "public/registry/maps" },
  { sourceRoot: "mods", destinationRoot: "public/registry/mods" },
  { sourceRoot: "supporters", destinationRoot: "public/registry/supporters" },
];

const MIRROR_FILE_BLACKLIST_BY_ROOT = {
  maps: [
    "demand-attribution-delta.json",
    "demand-stats-cache.json",
    "download-attribution-delta.json",
    "download-version-buckets.json",
    "grandfathered-downloads.json",
    "integrity-cache.json",
  ],
  mods: [
    "download-attribution-delta.json",
    "download-version-buckets.json",
    "grandfathered-downloads.json",
    "integrity-cache.json",
  ],
};

const FETCH_STEPS = [
  "Load local environment",
  "Validate GitHub token",
  "Fetch registry snapshot",
  "Copy registry and railyard artifacts",
  "Mirror registry content trees",
  "Transform website analytics",
  "Write website artifacts",
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

function copyMappedFiles(snapshotRoot, workspaceRoot, materializedFiles, progress) {
  for (const [index, mapping] of COPY_MAPPINGS.entries()) {
    const sourcePath = path.join(snapshotRoot, mapping.source);
    if (!existsSync(sourcePath)) {
      fail(`required registry file is missing: ${mapping.source}`);
    }

    const destinationPath = path.join(workspaceRoot, mapping.destination);
    ensureDirForFile(destinationPath);
    copyFileSync(sourcePath, destinationPath);
    materializedFiles.push(mapping.destination.replace(/\\/g, "/"));
    progress.detail(`Copied ${index + 1}/${COPY_MAPPINGS.length}: ${mapping.destination}`);
  }
}

function shouldSkipMirroredFile(sourceRoot, relativePath) {
  const blacklist = MIRROR_FILE_BLACKLIST_BY_ROOT[sourceRoot] ?? [];
  if (blacklist.length === 0) return false;

  const normalized = relativePath.replace(/\\/g, "/");
  if (normalized.includes("/")) return false;

  for (const token of blacklist) {
    if (normalized === token) {
      return true;
    }
  }

  return false;
}

function mirrorDirectoryRoots(snapshotRoot, workspaceRoot, materializedFiles, progress) {
  for (const mapping of MIRROR_DIRECTORY_MAPPINGS) {
    const sourceRootPath = path.join(snapshotRoot, mapping.sourceRoot);
    if (!existsSync(sourceRootPath)) {
      fail(`required registry directory is missing: ${mapping.sourceRoot}`);
    }

    let copiedCount = 0;
    let skippedCount = 0;
    const stack = [""];

    while (stack.length > 0) {
      const relativeDir = stack.pop() ?? "";
      const sourceDir = path.join(sourceRootPath, relativeDir);
      const destinationDir = path.join(workspaceRoot, mapping.destinationRoot, relativeDir);
      mkdirSync(destinationDir, { recursive: true });

      const entries = readdirSync(sourceDir, { withFileTypes: true }).sort((left, right) =>
        left.name.localeCompare(right.name),
      );

      for (const entry of entries) {
        const entryRelativePath = relativeDir ? path.join(relativeDir, entry.name) : entry.name;

        if (entry.isDirectory()) {
          stack.push(entryRelativePath);
          continue;
        }

        if (!entry.isFile()) {
          continue;
        }

        if (shouldSkipMirroredFile(mapping.sourceRoot, entryRelativePath)) {
          skippedCount += 1;
          continue;
        }

        const sourcePath = path.join(sourceRootPath, entryRelativePath);
        const destinationPath = path.join(
          workspaceRoot,
          mapping.destinationRoot,
          entryRelativePath,
        );
        ensureDirForFile(destinationPath);
        copyFileSync(sourcePath, destinationPath);

        const materializedPath = path
          .join(mapping.destinationRoot, entryRelativePath)
          .replace(/\\/g, "/");
        materializedFiles.push(materializedPath);
        copiedCount += 1;
      }
    }

    progress.detail(
      `Mirrored ${mapping.sourceRoot}/ -> ${mapping.destinationRoot}/ (${copiedCount} files, ${skippedCount} skipped)`,
    );
  }
}

function writeWebsiteFiles(parsedWebsite, workspaceRoot, materializedFiles, progress) {
  const outputs = {
    "public/website/summary.json": parsedWebsite.summary,
    "public/website/timeseries.json": parsedWebsite.timeseries,
    "public/website/pages.json": parsedWebsite.pages,
    "public/website/countries.json": parsedWebsite.countries,
    "public/website/browsers.json": parsedWebsite.browsers,
    "public/website/operating-systems.json": parsedWebsite.operatingSystems,
    "public/website/devices.json": parsedWebsite.devices,
    "public/website/valid-paths.json": parsedWebsite.validPaths,
    "public/website/path-aliases.json": parsedWebsite.pathAliases,
    "public/website/daily-history.json": parsedWebsite.dailyHistory,
  };

  const outputEntries = Object.entries(outputs);
  for (const [index, [relativePath, value]] of outputEntries.entries()) {
    const fullPath = path.join(workspaceRoot, relativePath);
    writeJson(fullPath, value);
    materializedFiles.push(relativePath);
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

  const tempRoot = mkdtempSync(path.join(tmpdir(), "website-dev-registry-"));
  const cloneDir = path.join(tempRoot, "registry");
  const basicAuthHeader = Buffer.from(`x-access-token:${token}`, "utf8").toString("base64");

  try {
    progress.step("Fetch registry snapshot");
    runGit([
      "-c",
      `http.extraheader=AUTHORIZATION: basic ${basicAuthHeader}`,
      "-c",
      "credential.helper=",
      "clone",
      "--depth",
      "1",
      "--branch",
      REGISTRY_REF,
      `https://github.com/${REGISTRY_REPO}.git`,
      cloneDir,
    ]);

    const commitSha = runGit(["-C", cloneDir, "rev-parse", "HEAD"]);
    const fetchedAt = new Date().toISOString();
    const materializedFiles = [];

    progress.detail(`Fetched ${REGISTRY_REPO}@${REGISTRY_REF} (${commitSha})`);

    progress.step("Copy registry and railyard artifacts");
    copyMappedFiles(cloneDir, workspaceRoot, materializedFiles, progress);

    progress.step("Mirror registry content trees");
    mirrorDirectoryRoots(cloneDir, workspaceRoot, materializedFiles, progress);

    const websiteAnalyticsPath = path.join(cloneDir, "analytics", "website_analytics.json");
    if (!existsSync(websiteAnalyticsPath)) {
      fail("required registry file is missing: analytics/website_analytics.json");
    }

    progress.step("Transform website analytics");
    const parsedWebsite = parseWebsiteAnalytics(readJson(websiteAnalyticsPath));
    progress.detail(`Prepared ${parsedWebsite.timeseries.length} daily website analytics points`);

    progress.step("Write website artifacts");
    writeWebsiteFiles(parsedWebsite, workspaceRoot, materializedFiles, progress);

    const metadata = {
      sourceRepo: REGISTRY_REPO,
      sourceRef: REGISTRY_REF,
      commitSha,
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
      "registry",
      "analytics",
      "snapshot-meta.json",
    );
    writeJson(registryMetaPath, {
      sourceRepo: REGISTRY_REPO,
      sourceRef: REGISTRY_REF,
      commitSha,
      fetchedAt,
      files: materializedFiles
        .filter((file) => file.startsWith("public/registry/analytics/"))
        .sort((a, b) => a.localeCompare(b)),
    });
    progress.detail("Wrote public/registry/analytics/snapshot-meta.json");

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
      fetchedAt,
      files: materializedFiles
        .filter((file) => file.startsWith("public/railyard/analytics/"))
        .sort((a, b) => a.localeCompare(b)),
    });
    progress.detail("Wrote public/railyard/analytics/snapshot-meta.json");

    console.log(
      `[fetch-registry-site-data] materialized ${materializedFiles.length} files from ${REGISTRY_REPO}@${REGISTRY_REF} (${commitSha})`,
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
