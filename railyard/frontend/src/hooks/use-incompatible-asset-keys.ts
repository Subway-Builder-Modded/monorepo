import type { AssetType } from '@subway-builder-modded/config';
import { useEffect, useState } from 'react';

import { useGameVersion } from '@/hooks/use-game-version';
import { assetKey } from '@/lib/asset-key';
import {
  getDownloadableVersions,
  selectLatestCompatibleVersion,
} from '@/lib/version-compatibility';

import type { types } from '../../wailsjs/go/models';
import { GetInstallableVersionsResponse } from '../../wailsjs/go/registry/Registry';

export interface AssetRef {
  type: AssetType;
  id: string;
}

// isGameVersionIncompatible reports whether the game version can install no downloadable
// version of the asset. Unknown game version is treated as compatible (we can't judge).
export function isGameVersionIncompatible(
  assetType: AssetType,
  versions: types.VersionInfo[],
  gameVersion: string,
): boolean {
  if (!gameVersion) return false;
  const downloadable = getDownloadableVersions(assetType, versions);
  if (downloadable.length === 0) return false;
  return !selectLatestCompatibleVersion(downloadable, gameVersion);
}

/**
 * Resolves which of the given assets have no game-compatible installable version, keyed by
 * assetKey. Fetches installable versions per asset (cached in the registry).
 * Returns an empty set while the game version is undetected — unknown is not incompatible.
 *
 * Pass a memoized assetRefs so the effect only re-runs when the asset set or game version
 * actually changes.
 */
export function useIncompatibleAssetKeys(
  assetRefs: AssetRef[],
): ReadonlySet<string> {
  const gameVersion = useGameVersion();
  const [keys, setKeys] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;
    if (!gameVersion) {
      setKeys(new Set());
      return () => {
        cancelled = true;
      };
    }

    Promise.all(
      assetRefs.map(async ({ type, id }) => {
        try {
          const response = await GetInstallableVersionsResponse(type, id);
          if (response.status !== 'success') return null;
          return isGameVersionIncompatible(
            type,
            response.versions ?? [],
            gameVersion,
          )
            ? assetKey(type, id)
            : null;
        } catch {
          return null;
        }
      }),
    )
      .then((resolved) => {
        if (!cancelled) {
          setKeys(new Set(resolved.filter((k): k is string => k !== null)));
        }
      })
      .catch(() => {
        if (!cancelled) setKeys(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [gameVersion, assetRefs]);

  return keys;
}
