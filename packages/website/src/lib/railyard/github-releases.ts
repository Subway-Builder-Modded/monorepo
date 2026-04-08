export interface GithubReleaseAsset {
  name: string;
  browser_download_url: string;
  download_count: number;
  size: number;
}

export interface GithubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  prerelease: boolean;
  assets: GithubReleaseAsset[];
  game_version?: string;
}

export interface CustomVersionEntry {
  version: string;
  name: string;
  changelog: string;
  date: string;
  download_url: string;
  game_version: string;
  sha256: string;
  downloads: number;
  manifest?: string;
  prerelease: boolean;
}

interface GithubReleaseCacheFile {
  schema_version: number;
  generated_at: string;
  repos: Record<string, GithubRelease[]>;
  custom_urls?: Record<string, CustomVersionEntry[]>;
}

const CACHE_URL = '/railyard/github-releases-cache.json';
let cachePromise: Promise<GithubReleaseCacheFile | null> | null = null;

function normalizeRepo(repo: string): string {
  return repo.trim().toLowerCase();
}

function normalizeCustomUrl(url: string): string {
  return url.trim();
}

async function readReleaseCacheFile(): Promise<GithubReleaseCacheFile | null> {
  try {
    const response = await fetch(CACHE_URL, { cache: 'no-store' });
    if (!response.ok) return null;
    const payload = (await response.json()) as GithubReleaseCacheFile;
    if (!payload || typeof payload !== 'object' || !payload.repos) return null;
    return payload;
  } catch {
    return null;
  }
}

async function getReleaseCache(): Promise<GithubReleaseCacheFile | null> {
  if (!cachePromise) {
    cachePromise = readReleaseCacheFile();
  }
  return cachePromise;
}

function sanitizeRelease(input: unknown): GithubRelease {
  const entry = (input ?? {}) as Record<string, unknown>;
  const rawAssets = Array.isArray(entry.assets) ? entry.assets : [];

  return {
    tag_name: typeof entry.tag_name === 'string' ? entry.tag_name : '',
    name: typeof entry.name === 'string' ? entry.name : '',
    body: typeof entry.body === 'string' ? entry.body : '',
    published_at:
      typeof entry.published_at === 'string' ? entry.published_at : '',
    prerelease: Boolean(entry.prerelease),
    assets: rawAssets.map((asset) => {
      const value = (asset ?? {}) as Record<string, unknown>;
      return {
        name: typeof value.name === 'string' ? value.name : '',
        browser_download_url:
          typeof value.browser_download_url === 'string'
            ? value.browser_download_url
            : '',
        download_count:
          typeof value.download_count === 'number' &&
          Number.isFinite(value.download_count)
            ? value.download_count
            : 0,
        size:
          typeof value.size === 'number' && Number.isFinite(value.size)
            ? value.size
            : 0,
      };
    }),
    game_version:
      typeof entry.game_version === 'string' ? entry.game_version : undefined,
  };
}

function sanitizeCustomVersion(input: unknown): CustomVersionEntry {
  const entry = (input ?? {}) as Record<string, unknown>;
  return {
    version: typeof entry.version === 'string' ? entry.version : '',
    name:
      typeof entry.name === 'string'
        ? entry.name
        : typeof entry.version === 'string'
          ? entry.version
          : '',
    changelog: typeof entry.changelog === 'string' ? entry.changelog : '',
    date: typeof entry.date === 'string' ? entry.date : '',
    download_url:
      typeof entry.download_url === 'string' ? entry.download_url : '',
    game_version:
      typeof entry.game_version === 'string' ? entry.game_version : '',
    sha256: typeof entry.sha256 === 'string' ? entry.sha256 : '',
    downloads:
      typeof entry.downloads === 'number' && Number.isFinite(entry.downloads)
        ? entry.downloads
        : 0,
    manifest: typeof entry.manifest === 'string' ? entry.manifest : undefined,
    prerelease: Boolean(entry.prerelease),
  };
}

async function fetchGitHubReleasesDirect(
  repo: string,
): Promise<GithubRelease[]> {
  const response = await fetch(`https://api.github.com/repos/${repo}/releases`);
  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub releases for ${repo}`);
  }
  const releases = (await response.json()) as unknown[];
  return Array.isArray(releases) ? releases.map(sanitizeRelease) : [];
}

async function fetchCustomVersionsDirect(
  url: string,
): Promise<CustomVersionEntry[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch custom versions from ${url}`);
  }
  const data = (await response.json()) as unknown;
  const rawVersions = Array.isArray(data)
    ? data
    : Array.isArray((data as { versions?: unknown[] })?.versions)
      ? (data as { versions: unknown[] }).versions
      : [];
  return rawVersions.map((entry) => sanitizeCustomVersion(entry));
}

export async function getGithubReleases(
  repo: string,
  options?: { preferNetwork?: boolean },
): Promise<GithubRelease[]> {
  const normalizedRepo = repo.trim();
  if (!normalizedRepo) return [];

  if (options?.preferNetwork) {
    try {
      return await fetchGitHubReleasesDirect(normalizedRepo);
    } catch {
      // Fall back to cache/direct fallback path below.
    }
  }

  const cache = await getReleaseCache();
  const cached = cache?.repos[normalizeRepo(normalizedRepo)];
  if (Array.isArray(cached)) return cached.map(sanitizeRelease);

  return fetchGitHubReleasesDirect(normalizedRepo);
}

export async function getCustomVersions(
  url: string,
  options?: { preferNetwork?: boolean },
): Promise<CustomVersionEntry[]> {
  const normalizedUrl = normalizeCustomUrl(url);
  if (!normalizedUrl) return [];

  if (options?.preferNetwork) {
    try {
      return await fetchCustomVersionsDirect(normalizedUrl);
    } catch {
      // Fall back to cache/direct fallback path below.
    }
  }

  const cache = await getReleaseCache();
  const cached = cache?.custom_urls?.[normalizedUrl];
  if (Array.isArray(cached)) return cached.map(sanitizeCustomVersion);

  return fetchCustomVersionsDirect(normalizedUrl);
}
