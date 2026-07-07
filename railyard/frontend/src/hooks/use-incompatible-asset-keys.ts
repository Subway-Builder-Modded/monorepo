import type { AssetType } from '@subway-builder-modded/config';
import { useEffect, useState } from 'react';

import { useGameVersion } from '@/hooks/use-game-version';
import { assetKey } from '@/lib/asset-key';

import { GameIncompatibleAssets } from '../../wailsjs/go/registry/Registry';

const ASSET_TYPES: AssetType[] = ['mod', 'map'];

/**
 * Returns the set of assetKey()s for assets that have no game-compatible installable version.
 *
 * The backend computes this from the integrity report (which already carries every version's
 * game_version and buildings format) — no per-asset remote fetch, so it makes zero GitHub API calls
 * regardless of catalog size. Empty while the game version is undetected: unknown is not incompatible.
 */
export function useIncompatibleAssetKeys(): ReadonlySet<string> {
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
      ASSET_TYPES.map((type) => GameIncompatibleAssets(type, gameVersion)),
    )
      .then((responses) => {
        if (cancelled) return;
        const next = new Set<string>();
        responses.forEach((response, index) => {
          if (response.status !== 'success') return;
          const type = ASSET_TYPES[index];
          for (const id of response.assetIds ?? []) {
            next.add(assetKey(type, id));
          }
        });
        setKeys(next);
      })
      .catch(() => {
        if (!cancelled) setKeys(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [gameVersion]);

  return keys;
}
