import { ASSET_TYPES, type AssetType } from '@subway-builder-modded/config';
import { toCumulativeDownloadTotals } from '@subway-builder-modded/config';
import { create } from 'zustand';

import type { types } from '../../wailsjs/go/models';
import {
  GetDownloadCountsByAssetType,
  GetMapsResponse,
  GetModsResponse,
  RefreshResponse,
} from '../../wailsjs/go/registry/Registry';

interface RegistryState {
  mods: types.ModManifest[];
  maps: types.MapManifest[];
  modDownloadTotals: Record<string, number>;
  mapDownloadTotals: Record<string, number>;
  downloadTotalsLoaded: boolean;
  loading: boolean;
  refreshing: boolean;
  startupRefreshing: boolean;
  error: string | null;
  initialized: boolean;
  ensureDownloadTotals: (options?: { force?: boolean }) => Promise<void>;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  setStartupRefreshing: (value: boolean) => void;
}

let downloadTotalsRequest: Promise<void> | null = null;
let downloadTotalsGeneration = 0;

function emptyRecordByAssetType<T>(factory: () => T): Record<AssetType, T> {
  return Object.fromEntries(
    ASSET_TYPES.map((assetType) => [assetType, factory()]),
  ) as Record<AssetType, T>;
}

async function loadRegistryData() {
  const [modsResponse, mapsResponse] = await Promise.all([
    GetModsResponse(),
    GetMapsResponse(),
  ]);

  if (modsResponse.status !== 'success') {
    throw new Error(modsResponse.message || 'Failed to load mods');
  }
  if (mapsResponse.status !== 'success') {
    throw new Error(mapsResponse.message || 'Failed to load maps');
  }

  return {
    mods: modsResponse.mods || [],
    maps: mapsResponse.maps || [],
  };
}

export const useRegistryStore = create<RegistryState>((set, get) => ({
  mods: [],
  maps: [],
  modDownloadTotals: {},
  mapDownloadTotals: {},
  downloadTotalsLoaded: false,
  loading: false,
  refreshing: false,
  startupRefreshing: false,
  error: null,
  initialized: false,

  setStartupRefreshing: (value) => set({ startupRefreshing: value }),

  ensureDownloadTotals: async (options) => {
    const force = options?.force ?? false;
    if (!force && get().downloadTotalsLoaded) return;

    if (!force && downloadTotalsRequest) {
      await downloadTotalsRequest;
      return;
    }

    const requestGeneration = ++downloadTotalsGeneration;
    if (force) {
      set({ downloadTotalsLoaded: false });
    }

    const request = (async () => {
      try {
        const results = await Promise.all(
          ASSET_TYPES.map((assetType) =>
            GetDownloadCountsByAssetType(assetType),
          ),
        );

        const totalsByAsset = emptyRecordByAssetType<Record<string, number>>(
          () => ({}),
        );

        results.forEach((result, index) => {
          const assetType = ASSET_TYPES[index];
          if (result.status === 'success') {
            totalsByAsset[assetType] = toCumulativeDownloadTotals(
              result.counts,
            );
            return;
          }
          console.warn(
            `[downloads:${assetType}] Failed to load download counts: ${result.message}`,
          );
        });

        if (requestGeneration !== downloadTotalsGeneration) return;
        set({
          modDownloadTotals: totalsByAsset.mod,
          mapDownloadTotals: totalsByAsset.map,
          downloadTotalsLoaded: true,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[downloads] Failed to load download counts: ${message}`);
        if (requestGeneration !== downloadTotalsGeneration) return;
        set({
          modDownloadTotals: {},
          mapDownloadTotals: {},
          downloadTotalsLoaded: true,
        });
      }
    })();

    downloadTotalsRequest = request;
    try {
      await request;
    } finally {
      if (downloadTotalsRequest === request) {
        downloadTotalsRequest = null;
      }
    }
  },

  initialize: async () => {
    if (get().initialized) return;
    set({ loading: true, error: null });
    try {
      const { mods, maps } = await loadRegistryData();
      set({
        mods,
        maps,
        initialized: true,
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        initialized: true,
        loading: false,
      });
    }
  },

  refresh: async () => {
    set({ refreshing: true, error: null });
    try {
      const refreshResponse = await RefreshResponse();
      if (refreshResponse.status !== 'success') {
        throw new Error(
          refreshResponse.message || 'Failed to refresh registry',
        );
      }
      const { mods, maps } = await loadRegistryData();
      set({
        mods,
        maps,
        initialized: true,
        loading: false,
      });
      await get().ensureDownloadTotals({ force: true });
      set({ refreshing: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        refreshing: false,
      });
    }
  },
}));
