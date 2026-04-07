import { existsSync, readFileSync } from 'fs';
import path from 'path';
import {
  createRegistryAuthorDirectory,
  type RegistryAuthorDirectoryEntry,
} from '@/lib/authors';
import {
  REGISTRY_ANALYTICS_SENTINEL,
  resolveRegistryAnalyticsDir,
} from '@/lib/registry-analytics-paths';
import type { RegistryAuthorsIndex } from '@/types/registry';

let authorDirectoryCache: Map<string, RegistryAuthorDirectoryEntry> | null =
  null;

const REGISTRY_AUTHORS_CACHE_FILE = 'authors_index.json';

function resolveAnalyticsDir(): string {
  return resolveRegistryAnalyticsDir({
    cwd: process.cwd(),
    envDir: process.env['REGISTRY_ANALYTICS_DIR'],
    hasSentinelFile: (dir) =>
      existsSync(path.join(dir, REGISTRY_ANALYTICS_SENTINEL)),
  });
}

export function loadRegistryAuthorDirectoryFromCache(): Map<
  string,
  RegistryAuthorDirectoryEntry
> {
  if (authorDirectoryCache) return authorDirectoryCache;

  const candidate = path.join(
    resolveAnalyticsDir(),
    REGISTRY_AUTHORS_CACHE_FILE,
  );
  if (existsSync(candidate)) {
    try {
      const payload = JSON.parse(
        readFileSync(candidate, 'utf-8'),
      ) as RegistryAuthorsIndex;
      authorDirectoryCache = createRegistryAuthorDirectory(payload);
      return authorDirectoryCache;
    } catch {
      // Fall through to empty cache if parsing fails.
    }
  }

  authorDirectoryCache = new Map<string, RegistryAuthorDirectoryEntry>();
  return authorDirectoryCache;
}
