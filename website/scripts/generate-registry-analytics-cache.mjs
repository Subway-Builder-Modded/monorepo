import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'public', 'registry', 'analytics');
const META_FILE = path.join(OUTPUT_DIR, 'snapshot-meta.json');

const REPO_OWNER = 'Subway-Builder-Modded';
const REPO_NAME = 'registry';
const REPO_NAME_FALLBACK = 'The-Railyard';
const REPO_BRANCH = 'main';
const RAW_REPO_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}`;
const RAW_REPO_BASE_FALLBACK = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME_FALLBACK}/${REPO_BRANCH}`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/analytics`;
const RAW_BASE_FALLBACK = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME_FALLBACK}/${REPO_BRANCH}/analytics`;
const AUTHORS_INDEX_CACHE_FILE = 'authors_index.json';

const TOKEN =
  process.env['RAILYARD_GITHUB_TOKEN']?.trim() ||
  '';

const ANALYTICS_FILES = [
  'most_popular_all_time.csv',
  'most_popular_last_1d.csv',
  'most_popular_last_3d.csv',
  'most_popular_last_7d.csv',
  'authors_by_total_downloads.csv',
  'projects_most_popular_all_time.csv',
  'projects_most_popular_last_1d.csv',
  'projects_most_popular_last_3d.csv',
  'projects_most_popular_last_7d.csv',
  'listing_projects.csv',
  'maps_statistics.csv',
  'assets_by_day.csv',
  'most_popular_by_day.csv',
  'authors_by_day.csv',
];
const TOTAL_CACHE_FILES = ANALYTICS_FILES.length + 1;

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

function buildHeaders() {
  const headers = {
    Accept: 'text/csv, text/plain;q=0.9, */*;q=0.8',
    'User-Agent': 'subway-builder-modded-website/registry-analytics-cache',
  };
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  }
  return headers;
}

async function fetchCsv(filename) {
  const bases = [RAW_BASE, RAW_BASE_FALLBACK];
  let lastError;
  for (const base of bases) {
    const url = `${base}/${filename}`;
    try {
      const response = await fetch(url, { headers: buildHeaders() });
      if (response.ok) return response.text();
      lastError = new Error(`${response.status} ${response.statusText} for ${url}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function fetchRepoJson(relativePath) {
  const bases = [RAW_REPO_BASE, RAW_REPO_BASE_FALLBACK];
  let lastError;
  for (const base of bases) {
    const url = `${base}/${relativePath}`;
    try {
      const response = await fetch(url, { headers: buildHeaders() });
      if (response.ok) return response.text();
      lastError = new Error(`${response.status} ${response.statusText} for ${url}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function buildSnapshotLabel(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute} UTC`;
}

async function main() {
  ensureDir(OUTPUT_DIR);

  const previousMeta = readJson(META_FILE, {});
  const fetched = [];
  const failures = [];

  for (const file of ANALYTICS_FILES) {
    try {
      const text = await fetchCsv(file);
      writeFileSync(path.join(OUTPUT_DIR, file), text);
      fetched.push(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ file, error: message });
      console.warn(`[registry-analytics] Failed ${file}: ${message}`);
    }
  }

  try {
    const authorsIndex = await fetchRepoJson('authors/index.json');
    writeFileSync(path.join(OUTPUT_DIR, AUTHORS_INDEX_CACHE_FILE), authorsIndex);
    fetched.push(AUTHORS_INDEX_CACHE_FILE);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ file: AUTHORS_INDEX_CACHE_FILE, error: message });
    console.warn(
      `[registry-analytics] Failed ${AUTHORS_INDEX_CACHE_FILE}: ${message}`,
    );
  }

  const now = new Date();
  const nextMeta = {
    ...previousMeta,
    source: `${REPO_OWNER}/${REPO_NAME}@${REPO_BRANCH}`,
    generatedAt: now.toISOString(),
    snapshotLabel: buildSnapshotLabel(now),
    files: fetched,
    failedFiles: failures,
  };
  writeJson(META_FILE, nextMeta);

  if (fetched.length === 0) {
    console.warn(
      '[registry-analytics] No files were refreshed. Keeping existing cached analytics files.',
    );
    return;
  }

  console.log(
    `[registry-analytics] Cached ${fetched.length}/${TOTAL_CACHE_FILES} files in ${OUTPUT_DIR}.`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[registry-analytics] generation failed: ${message}`);
  process.exitCode = 0;
});

