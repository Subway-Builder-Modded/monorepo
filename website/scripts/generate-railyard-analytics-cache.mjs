import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'public', 'railyard', 'analytics');
const META_FILE = path.join(OUTPUT_DIR, 'snapshot-meta.json');

const REPO_OWNER = 'Subway-Builder-Modded';
const REPO_NAME = 'registry';
const REPO_NAME_FALLBACK = 'The-Railyard';
const REPO_BRANCH = 'main';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}`;
const RAW_BASE_FALLBACK = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME_FALLBACK}/${REPO_BRANCH}`;

const TOKEN =
  process.env['RAILYARD_GITHUB_TOKEN']?.trim() ||
  '';

const ANALYTICS_FILES = [
  {
    sourcePath: 'analytics/railyard_app_downloads.json',
    outputName: 'railyard_app_downloads.json',
  },
  {
    sourcePath: 'analytics/railyard_app_by_day.csv',
    outputName: 'railyard_app_by_day.csv',
  },
  {
    sourcePath: 'history/railyard_app_downloads.json',
    outputName: 'railyard_app_downloads_history.json',
  },
];

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
    Accept: 'application/json, text/csv, text/plain;q=0.9, */*;q=0.8',
    'User-Agent': 'subway-builder-modded-website/railyard-analytics-cache',
  };
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  }
  return headers;
}

async function fetchFile(sourcePath) {
  const bases = [RAW_BASE, RAW_BASE_FALLBACK];
  let lastError;
  for (const base of bases) {
    const url = `${base}/${sourcePath}`;
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
      const text = await fetchFile(file.sourcePath);
      writeFileSync(path.join(OUTPUT_DIR, file.outputName), text);
      fetched.push(file.outputName);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ file: file.outputName, sourcePath: file.sourcePath, error: message });
      console.warn(`[railyard-analytics] Failed ${file.outputName}: ${message}`);
    }
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
      '[railyard-analytics] No files were refreshed. Keeping existing cached analytics files.',
    );
    return;
  }

  console.log(
    `[railyard-analytics] Cached ${fetched.length}/${ANALYTICS_FILES.length} files in ${OUTPUT_DIR}.`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[railyard-analytics] generation failed: ${message}`);
  process.exitCode = 0;
});
