import type { AssetType } from '@subway-builder-modded/config';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useGameVersion } from '@/hooks/use-game-version';
import { assetKey } from '@/lib/asset-key';
import { measureAsync } from '@/lib/perf';
import { useRegistryStore } from '@/stores/registry-store';

import { GameIncompatibleAssets } from '../../wailsjs/go/registry/Registry';

const ASSET_TYPES: AssetType[] = ['mod', 'map'];

const IncompatibleAssetKeysContext = createContext<ReadonlySet<string>>(
  new Set(),
);

/**
 * Resolves the assetKey()s of assets with no game-compatible installable version ONCE per game
 * version and registry snapshot and shares the result, so the several consumers (Browse, the
 * Home grids) don't each fan out their own GameIncompatibleAssets calls or build competing Set
 * identities that would invalidate downstream filter memos.
 */
export function IncompatibleAssetKeysProvider({
  children,
}: {
  children: ReactNode;
}) {
  const gameVersion = useGameVersion();
  // Registry reloads replace these arrays, re-deriving the set when a refresh lands new
  // installable versions that change an asset's compatibility.
  const registryMods = useRegistryStore((s) => s.mods);
  const registryMaps = useRegistryStore((s) => s.maps);
  const [keys, setKeys] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;
    if (!gameVersion) {
      setKeys(new Set());
      return () => {
        cancelled = true;
      };
    }

    // The backend derives this from the integrity report — no per-asset remote fetch.
    measureAsync('incompatibleAssets.fetch', () =>
      Promise.all(
        ASSET_TYPES.map((type) => GameIncompatibleAssets(type, gameVersion)),
      ),
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
  }, [gameVersion, registryMods, registryMaps]);

  return (
    <IncompatibleAssetKeysContext.Provider value={keys}>
      {children}
    </IncompatibleAssetKeysContext.Provider>
  );
}

// useIncompatibleAssetKeys reads the shared incompatible-key set. Empty while the game version is
// undetected or the first resolution is in flight.
export function useIncompatibleAssetKeys(): ReadonlySet<string> {
  return useContext(IncompatibleAssetKeysContext);
}
