import type { AssetType } from '@subway-builder-modded/config';
import { useEffect, useState } from 'react';

import { useGameVersion } from '@/hooks/use-game-version';
import { assetKey } from '@/lib/asset-key';

import { GameIncompatibleAssets } from '../../wailsjs/go/registry/Registry';

const ASSET_TYPES: AssetType[] = ['mod', 'map'];

/**
 * Returns the assetKey()s of assets with no game-compatible installable version. The backend derives
 * this from the integrity report — no per-asset remote fetch. Empty while the game version is undetected.
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
