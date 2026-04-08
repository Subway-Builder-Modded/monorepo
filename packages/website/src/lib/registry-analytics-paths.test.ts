import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveRegistryAnalyticsDir } from '@/lib/registry-analytics-paths';

describe('resolveRegistryAnalyticsDir', () => {
  const cwd = '/repo/website';

  it('prefers explicit env path when sentinel exists', () => {
    const envPath = '/custom/analytics';
    const resolved = resolveRegistryAnalyticsDir({
      cwd,
      envDir: envPath,
      hasSentinelFile: (dir) => dir === envPath,
    });

    expect(resolved).toBe(envPath);
  });

  it('falls back to public registry cache before sibling repo locations', () => {
    const cachePath = path.join(cwd, 'public', 'registry', 'analytics');
    const siblingPath = path.join(cwd, '..', 'registry', 'analytics');
    const legacyPath = path.join(cwd, 'The-Railyard', 'analytics');
    const resolved = resolveRegistryAnalyticsDir({
      cwd,
      hasSentinelFile: (dir) =>
        dir === cachePath || dir === siblingPath || dir === legacyPath,
    });

    expect(resolved).toBe(cachePath);
  });

  it('prefers registry sibling directory over legacy The-Railyard location', () => {
    const siblingPath = path.join(cwd, '..', 'registry', 'analytics');
    const legacyPath = path.join(cwd, 'The-Railyard', 'analytics');
    const resolved = resolveRegistryAnalyticsDir({
      cwd,
      hasSentinelFile: (dir) => dir === siblingPath || dir === legacyPath,
    });

    expect(resolved).toBe(siblingPath);
  });

  it('returns stable default when no candidates exist', () => {
    const resolved = resolveRegistryAnalyticsDir({
      cwd,
      hasSentinelFile: () => false,
    });

    expect(resolved).toBe(path.join(cwd, 'analytics'));
  });
});
