import path from 'node:path';

export const REGISTRY_ANALYTICS_SENTINEL = 'most_popular_all_time.csv';

type ResolveRegistryAnalyticsDirArgs = {
  cwd: string;
  envDir?: string;
  hasSentinelFile: (dir: string) => boolean;
};

export function resolveRegistryAnalyticsDir({
  cwd,
  envDir,
  hasSentinelFile,
}: ResolveRegistryAnalyticsDirArgs): string {
  const candidates = [
    envDir?.trim() || '',
    path.join(cwd, 'public', 'registry', 'analytics'),
    path.join(cwd, '..', 'registry', 'analytics'),
    path.join(cwd, 'registry', 'analytics'),
    path.join(cwd, '..', 'The-Railyard', 'analytics'),
    path.join(cwd, 'The-Railyard', 'analytics'),
    path.join(cwd, 'analytics'),
    path.join(cwd, 'public', 'analytics'),
  ].filter(Boolean);

  for (const dir of candidates) {
    if (hasSentinelFile(dir)) {
      return dir;
    }
  }

  return path.join(cwd, 'analytics');
}
