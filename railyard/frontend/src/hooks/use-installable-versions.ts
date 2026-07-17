import {
  mergeVersionDownloads,
  withZeroDownloads,
} from '@subway-builder-modded/asset-listings-ui';
import type { AssetType } from '@subway-builder-modded/config';
import { useEffect, useState } from 'react';

import { getDownloadableVersions } from '@/lib/version-compatibility';

import type { types } from '../../wailsjs/go/models';
import {
  GetAssetDownloadCounts,
  GetInstallableVersionsResponse,
} from '../../wailsjs/go/registry/Registry';

export interface InstallableVersionsState {
  versions: types.VersionInfo[];
  loading: boolean;
  error: string | null;
}

/**
 * Loads the installable versions for an asset: fetches the version list, keeps only the
 * downloadable ones, and merges in per-version download counts (best-effort — a counts
 * failure is logged, not fatal). Shared by the project and changelog pages.
 */
export function useInstallableVersions(
  type: AssetType | undefined,
  id: string | undefined,
): InstallableVersionsState {
  const [versions, setVersions] = useState<types.VersionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!type || !id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    // The version list and the per-version download counts are independent backend calls, so
    // fetch them concurrently. Counts are best-effort — a failure resolves to null and the
    // versions still render with zero counts.
    Promise.all([
      GetInstallableVersionsResponse(type, id),
      GetAssetDownloadCounts(type, id).catch(() => null),
    ])
      .then(([response, counts]) => {
        if (cancelled) return;
        if (response.status !== 'success') {
          setError(response.message || 'Failed to load versions');
          setLoading(false);
          return;
        }

        const downloadable = getDownloadableVersions(
          type,
          response.versions ?? [],
        );
        let merged = withZeroDownloads(downloadable);
        if (counts && counts.status === 'success') {
          merged = mergeVersionDownloads(
            downloadable,
            counts.counts ?? {},
            `${type}:${id}`,
          );
        } else if (counts) {
          console.warn(
            `[${type}:${id}] Failed to fetch download counts: ${counts.message}`,
          );
        }

        setVersions(merged);
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [type, id]);

  return { versions, loading, error };
}
