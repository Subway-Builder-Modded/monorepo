import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const REGISTRY_RAW_BASE = "https://raw.githubusercontent.com/Subway-Builder-Modded/registry/main/";
const REGISTRY_RAW_BASE_FALLBACK =
  "https://raw.githubusercontent.com/Subway-Builder-Modded/The-Railyard/main/";
const DEFAULT_OUTPUT_PATH = path.resolve(
  process.cwd(),
  "public/registry-cache/github-releases-cache.json",
);
const TOKEN =
  process.env.SBM_GITHUB_TOKEN?.trim() ||
  process.env.RAILYARD_GITHUB_TOKEN?.trim() ||
  process.env.GH_TOKEN?.trim() ||
  "";
const WORKER_LIMIT = 8;
const GAME_DEPENDENCY_KEY = "subway-builder";

function parseArgs(argv) {
  const options = {
    outputPath: DEFAULT_OUTPUT_PATH,
    snapshotRoot: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output" && argv[index + 1]) {
      options.outputPath = path.resolve(process.cwd(), argv[index + 1]);
      index += 1;
    } else if (arg === "--snapshot-root" && argv[index + 1]) {
      options.snapshotRoot = path.resolve(process.cwd(), argv[index + 1]);
      index += 1;
    }
  }

  return options;
}

function requestHeaders() {
  return TOKEN
    ? {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${TOKEN}`,
      }
    : { Accept: "application/vnd.github+json" };
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

function readSnapshotJson(snapshotRoot, relativePath) {
  const filePath = path.join(snapshotRoot, relativePath);
  if (!existsSync(filePath)) {
    throw new Error(`snapshot file missing: ${relativePath}`);
  }
  return JSON.parse(readFileSync(filePath, "utf8"));
}

async function fetchRegistryJson(relativePath, snapshotRoot) {
  if (snapshotRoot) {
    return readSnapshotJson(snapshotRoot, relativePath);
  }

  let lastError;
  for (const baseUrl of [REGISTRY_RAW_BASE, REGISTRY_RAW_BASE_FALLBACK]) {
    try {
      return await fetchJson(`${baseUrl}${relativePath}`, { headers: requestHeaders() });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function fetchIndex(type, snapshotRoot) {
  const data = await fetchRegistryJson(`${type}/index.json`, snapshotRoot);
  return Array.isArray(data?.[type]) ? data[type] : [];
}

async function fetchManifest(type, id, snapshotRoot) {
  return fetchRegistryJson(`${type}/${id}/manifest.json`, snapshotRoot);
}

async function collectManifests(snapshotRoot) {
  const [modIds, mapIds] = await Promise.all([
    fetchIndex("mods", snapshotRoot),
    fetchIndex("maps", snapshotRoot),
  ]);

  const [mods, maps] = await Promise.all([
    Promise.all(modIds.map((id) => fetchManifest("mods", id, snapshotRoot))),
    Promise.all(mapIds.map((id) => fetchManifest("maps", id, snapshotRoot))),
  ]);

  return [...mods, ...maps];
}

async function collectReleaseSources(snapshotRoot) {
  const manifests = await collectManifests(snapshotRoot);
  const repos = new Set(["Subway-Builder-Modded/monorepo"]);
  const customUrls = new Set();

  for (const manifest of manifests) {
    const update = manifest?.update;
    if (update?.type === "github" && typeof update.repo === "string") {
      const repo = update.repo.trim().toLowerCase();
      if (repo) {
        repos.add(repo);
      }
    }

    if (update?.type === "custom" && typeof update.url === "string") {
      const url = update.url.trim();
      if (url) {
        customUrls.add(url);
      }
    }
  }

  return { repos: [...repos], customUrls: [...customUrls] };
}

function sanitizeRelease(input) {
  const entry = input ?? {};
  const assets = Array.isArray(entry.assets) ? entry.assets : [];
  return {
    tag_name: typeof entry.tag_name === "string" ? entry.tag_name : "",
    name: typeof entry.name === "string" ? entry.name : "",
    body: typeof entry.body === "string" ? entry.body : "",
    published_at: typeof entry.published_at === "string" ? entry.published_at : "",
    prerelease: Boolean(entry.prerelease),
    assets: assets.map((asset) => ({
      name: typeof asset?.name === "string" ? asset.name : "",
      browser_download_url:
        typeof asset?.browser_download_url === "string" ? asset.browser_download_url : "",
      download_count:
        typeof asset?.download_count === "number" && Number.isFinite(asset.download_count)
          ? asset.download_count
          : 0,
      size: typeof asset?.size === "number" && Number.isFinite(asset.size) ? asset.size : 0,
    })),
  };
}

async function fetchManifestDependencies(url) {
  try {
    const response = await fetch(url, {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
    });
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const rawDependencies = data?.dependencies;
    if (!rawDependencies || typeof rawDependencies !== "object" || Array.isArray(rawDependencies)) {
      return null;
    }

    const gameVersion =
      typeof rawDependencies[GAME_DEPENDENCY_KEY] === "string"
        ? rawDependencies[GAME_DEPENDENCY_KEY]
        : undefined;
    const dependencies = Object.fromEntries(
      Object.entries(rawDependencies).filter(
        ([id, range]) => id !== GAME_DEPENDENCY_KEY && typeof range === "string",
      ),
    );
    return { gameVersion, dependencies };
  } catch {
    return null;
  }
}

async function enrichReleases(releases) {
  await Promise.allSettled(
    releases.map(async (release) => {
      const manifestAsset = release.assets.find((asset) => asset.name === "manifest.json");
      if (!manifestAsset?.browser_download_url) {
        return;
      }

      const enriched = await fetchManifestDependencies(manifestAsset.browser_download_url);
      if (!enriched) {
        return;
      }

      if (enriched.gameVersion !== undefined) {
        release.game_version = enriched.gameVersion;
      }
      if (Object.keys(enriched.dependencies).length > 0) {
        release.dependencies = enriched.dependencies;
      }
    }),
  );
}

async function fetchReleases(repo) {
  const releases = await fetchJson(`https://api.github.com/repos/${repo}/releases`, {
    headers: requestHeaders(),
  });
  const sanitized = Array.isArray(releases) ? releases.map(sanitizeRelease) : [];
  await enrichReleases(sanitized);
  return sanitized;
}

function sanitizeCustomVersion(input) {
  const entry = input ?? {};
  const rawDependencies = entry.dependencies;
  const dependencies =
    rawDependencies && typeof rawDependencies === "object" && !Array.isArray(rawDependencies)
      ? Object.fromEntries(
          Object.entries(rawDependencies).filter(([, value]) => typeof value === "string"),
        )
      : undefined;

  return {
    version: typeof entry.version === "string" ? entry.version : "",
    name:
      typeof entry.name === "string"
        ? entry.name
        : typeof entry.version === "string"
          ? entry.version
          : "",
    changelog: typeof entry.changelog === "string" ? entry.changelog : "",
    date: typeof entry.date === "string" ? entry.date : "",
    download_url: typeof entry.download_url === "string" ? entry.download_url : "",
    game_version: typeof entry.game_version === "string" ? entry.game_version : "",
    sha256: typeof entry.sha256 === "string" ? entry.sha256 : "",
    downloads:
      typeof entry.downloads === "number" && Number.isFinite(entry.downloads) ? entry.downloads : 0,
    manifest: typeof entry.manifest === "string" ? entry.manifest : undefined,
    prerelease: Boolean(entry.prerelease),
    dependencies,
  };
}

async function fetchCustomVersions(url) {
  const payload = await fetchJson(url, { headers: requestHeaders() });
  const rawVersions = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.versions)
      ? payload.versions
      : [];
  const versions = rawVersions.map(sanitizeCustomVersion);

  await Promise.allSettled(
    versions.map(async (version) => {
      if (!version.manifest || version.game_version || version.dependencies) {
        return;
      }

      const enriched = await fetchManifestDependencies(version.manifest);
      if (!enriched) {
        return;
      }

      if (enriched.gameVersion !== undefined) {
        version.game_version = enriched.gameVersion;
      }
      if (Object.keys(enriched.dependencies).length > 0) {
        version.dependencies = enriched.dependencies;
      }
    }),
  );

  return versions;
}

async function mapWithWorkers(values, mapper) {
  const queue = [...values];
  const result = {};
  const workers = Array.from(
    { length: Math.min(WORKER_LIMIT, Math.max(1, queue.length)) },
    async () => {
      while (queue.length > 0) {
        const value = queue.pop();
        if (!value) {
          return;
        }

        try {
          result[value] = await mapper(value);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.warn(`[github-cache] Failed ${value}: ${message}`);
          result[value] = [];
        }
      }
    },
  );

  await Promise.all(workers);
  return result;
}

async function main() {
  const { outputPath, snapshotRoot } = parseArgs(process.argv.slice(2));
  const { repos, customUrls } = await collectReleaseSources(snapshotRoot);
  const [releaseMap, customMap] = await Promise.all([
    mapWithWorkers(repos, fetchReleases),
    mapWithWorkers(customUrls, fetchCustomVersions),
  ]);

  const payload = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    repos: releaseMap,
    custom_urls: customMap,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(
    `[github-cache] wrote ${Object.keys(releaseMap).length} repos and ${Object.keys(customMap).length} custom sources to ${outputPath}`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[github-cache] generation failed: ${message}`);
  process.exit(1);
});
