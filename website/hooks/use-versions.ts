'use client';

import { useEffect, useState } from 'react';

import {
  getCustomVersions,
  getGithubReleases,
} from '@/lib/railyard/github-releases';
import type { UpdateConfig, VersionInfo } from '@/types/registry';

export async function fetchVersionsForUpdate(
  update?: UpdateConfig,
): Promise<VersionInfo[]> {
  if (!update) return [];

  if (update.type === 'github' && update.repo) {
    const releases = await getGithubReleases(update.repo, {
      preferNetwork: true,
    });

    return releases.map((release) => {
      const manifestAsset = release.assets.find(
        (a) => a.name === 'manifest.json',
      );
      const zipAsset = release.assets.find((a) => a.name.endsWith('.zip'));
      const totalDownloads = release.assets.reduce(
        (sum, a) => sum + a.download_count,
        0,
      );

      return {
        version: release.tag_name,
        name: release.name || release.tag_name,
        changelog: release.body || '',
        date: release.published_at,
        download_url: zipAsset?.browser_download_url ?? '',
        game_version: release.game_version ?? '',
        sha256: '',
        downloads: totalDownloads,
        manifest: manifestAsset?.browser_download_url,
        prerelease: release.prerelease,
      };
    });
  }

  if (update.url) {
    const entries = await getCustomVersions(update.url, {
      preferNetwork: true,
    });

    return entries.map((entry) => ({
      version: entry.version,
      name: entry.name || entry.version,
      changelog: entry.changelog,
      date: entry.date,
      download_url: entry.download_url,
      game_version: entry.game_version,
      sha256: entry.sha256,
      downloads: entry.downloads,
      manifest: entry.manifest,
      prerelease: entry.prerelease,
    }));
  }

  return [];
}

interface UseVersionsResult {
  versions: VersionInfo[];
  loading: boolean;
  error: string | null;
}

export function useVersions(update?: UpdateConfig): UseVersionsResult {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUpdate = update;
    if (!currentUpdate) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const mapped = await fetchVersionsForUpdate(currentUpdate);
        if (!cancelled) setVersions(mapped);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load versions',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [update]);

  return { versions, loading, error };
}
