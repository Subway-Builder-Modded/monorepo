import { create } from 'zustand';

import { ASSET_TYPES, type AssetType } from '@/lib/asset-types';
import { toCumulativeDownloadTotals } from '@/lib/download-totals';

import type { types } from '../../wailsjs/go/models';
import {
  GetDownloadCountsByAssetType,
  GetIntegrityReportResponse,
  GetMapsResponse,
  GetModsResponse,
  RefreshResponse,
} from '../../wailsjs/go/registry/Registry';

interface RegistryState {
  mods: types.ModManifest[];
  maps: types.MapManifest[];
  mapIntegrity: types.RegistryIntegrityReport | null;
  modIntegrity: types.RegistryIntegrityReport | null;
  modDownloadTotals: Record<string, number>;
  mapDownloadTotals: Record<string, number>;
  downloadTotalsLoaded: boolean;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  initialized: boolean;
  ensureDownloadTotals: (options?: { force?: boolean }) => Promise<void>;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
}

let downloadTotalsRequest: Promise<void> | null = null;
let downloadTotalsGeneration = 0;

function emptyRecordByAssetType<T>(factory: () => T): Record<AssetType, T> {
  return Object.fromEntries(
    ASSET_TYPES.map((assetType) => [assetType, factory()]),
  ) as Record<AssetType, T>;
}

function filterMapsAndModsByIntegrity(
  maps: types.MapManifest[],
  mods: types.ModManifest[],
  mapIntegrity: types.RegistryIntegrityReport,
  modIntegrity: types.RegistryIntegrityReport,
) {
  const finalMaps = [];
  const finalMods = [];
  let invalidCounter = 0;
  for (const mod of mods) {
    if (modIntegrity.listings[mod.id].has_complete_version) {
      finalMods.push(mod);
    } else {
      invalidCounter++;
    }
  }
  if (invalidCounter > 0) {
    console.warn(
      `Excluding ${invalidCounter} mods from registry due to incomplete versions`,
    );
  }

  invalidCounter = 0;
  for (const map of maps) {
    if (mapIntegrity.listings[map.id].has_complete_version) {
      finalMaps.push(map);
    } else {
      invalidCounter++;
    }
  }
  if (invalidCounter > 0) {
    console.warn(
      `Excluding ${invalidCounter} maps from registry due to incomplete versions`,
    );
  }
  return { finalMaps, finalMods };
}

async function loadRegistryData() {
  const [
    modsResponse,
    mapsResponse,
    mapIntegrityResponse,
    modIntegrityResponse,
  ] = await Promise.all([
    GetModsResponse(),
    GetMapsResponse(),
    GetIntegrityReportResponse('map'),
    GetIntegrityReportResponse('mod'),
  ]);

  if (modsResponse.status !== 'success') {
    throw new Error(modsResponse.message || 'Failed to load mods');
  }
  if (mapsResponse.status !== 'success') {
    throw new Error(mapsResponse.message || 'Failed to load maps');
  }
  if (mapIntegrityResponse.status !== 'success') {
    throw new Error(
      mapIntegrityResponse.message || 'Failed to load map integrity',
    );
  }
  if (modIntegrityResponse.status !== 'success') {
    throw new Error(
      modIntegrityResponse.message || 'Failed to load mod integrity',
    );
  }

  const { finalMaps, finalMods } = filterMapsAndModsByIntegrity(
    mapsResponse.maps,
    modsResponse.mods,
    mapIntegrityResponse.report,
    modIntegrityResponse.report,
  );

  return {
    mods: finalMods || [],
    maps: finalMaps || [],
    mapIntegrity: mapIntegrityResponse.report || null,
    modIntegrity: modIntegrityResponse.report || null,
  };
}

export const useRegistryStore = create<RegistryState>((set, get) => ({
  mods: [],
  maps: [],
  mapIntegrity: null,
  modIntegrity: null,
  modDownloadTotals: {},
  mapDownloadTotals: {},
  downloadTotalsLoaded: false,
  loading: false,
  refreshing: false,
  error: null,
  initialized: false,

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
      const { mods, maps, mapIntegrity, modIntegrity } =
        await loadRegistryData();
      set({
        mods,
        maps,
        mapIntegrity,
        modIntegrity,
        initialized: true,
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
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
      const { mods, maps, mapIntegrity, modIntegrity } =
        await loadRegistryData();
      set({
        mods,
        maps,
        mapIntegrity,
        modIntegrity,
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
