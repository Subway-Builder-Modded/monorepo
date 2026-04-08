import { create } from 'zustand';

import type { AssetType } from '@/lib/asset-types';
import {
  applyLatestSubscriptionUpdatesForActiveProfile,
  cancelInstallForAsset,
  importAssetForActiveProfile,
  mutateSubscriptionsForActiveProfile,
} from '@/lib/subscription-mutation-client';
export { SubscriptionMutationLockedError } from '@/lib/subscription-mutation-client';

import { types } from '../../wailsjs/go/models';
import {
  GetInstalledMapsResponse,
  GetInstalledModsResponse,
} from '../../wailsjs/go/registry/Registry';
import { useDownloadQueueStore } from './download-queue-store';

export class SubscriptionSyncError extends Error {
  readonly status: string;
  readonly profileErrors: types.UserProfilesError[];

  constructor(
    message: string,
    status: string,
    profileErrors: types.UserProfilesError[],
  ) {
    super(message);
    this.name = 'SubscriptionSyncError';
    this.status = status;
    this.profileErrors = profileErrors;
  }
}

export class AssetConflictError extends Error {
  readonly conflicts: types.MapCodeConflict[];
  readonly result: types.UpdateSubscriptionsResult;

  constructor(
    message: string,
    conflicts: types.MapCodeConflict[],
    result: types.UpdateSubscriptionsResult,
  ) {
    super(message);
    this.name = 'AssetConflictError';
    this.conflicts = conflicts;
    this.result = result;
  }
}

export class InvalidMapCodeError extends Error {
  readonly profileErrors: types.UserProfilesError[];

  constructor(message: string, profileErrors: types.UserProfilesError[]) {
    super(message);
    this.name = 'InvalidMapCodeError';
    this.profileErrors = profileErrors;
  }
}

function resolveSubscriptionSyncMessage(
  result: types.UpdateSubscriptionsResult,
  fallback: string,
): string {
  if (result.message?.trim()) {
    return result.message;
  }

  const firstError = result.errors?.[0];
  if (firstError?.message?.trim()) {
    return firstError.message;
  }

  return fallback;
}

function hasInvalidMapCodeError(
  errors: types.UserProfilesError[] | undefined,
): boolean {
  if (!errors) {
    return false;
  }
  return errors.some(
    (error) => error.downloaderErrorType === 'install_invalid_map_code',
  );
}

interface InstalledState {
  installedMods: types.InstalledModInfo[];
  installedMaps: types.InstalledMapInfo[];
  installing: Set<string>;
  installOperationsById: Record<
    string,
    { requestedVersion: string | null; rollbackVersion: string | null }
  >;
  uninstalling: Set<string>;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  initialize: () => Promise<void>;
  installMod: (
    id: string,
    version: string,
  ) => Promise<types.UpdateSubscriptionsResult>;
  installMap: (
    id: string,
    version: string,
    replaceOnConflict?: boolean,
  ) => Promise<types.UpdateSubscriptionsResult>;
  uninstallMod: (id: string) => Promise<types.UpdateSubscriptionsResult>;
  uninstallMap: (id: string) => Promise<types.UpdateSubscriptionsResult>;
  uninstallAssets: (
    assets: Array<{ id: string; type: AssetType }>,
  ) => Promise<types.UpdateSubscriptionsResult>;
  updateAssetsToLatest: (
    assets: Array<{ id: string; type: AssetType }>,
  ) => Promise<types.UpdateSubscriptionsResult>;
  importMapFromZip: (
    zipPath: string,
    replaceOnConflict?: boolean,
  ) => Promise<types.UpdateSubscriptionsResult>;
  cancelPendingInstall: (
    type: AssetType,
    id: string,
  ) => Promise<types.UpdateSubscriptionsResult>;
  acknowledgeCancelledInstall: (id: string) => void;
  isInstalled: (id: string) => boolean;
  getInstalledVersion: (id: string) => string | null;
  isOperating: (id: string) => boolean;
  isInstalling: (id: string) => boolean;
  getInstallingVersion: (id: string) => string | null;
  isUninstalling: (id: string) => boolean;
  updateInstalledLists: () => Promise<void>;
}

export const useInstalledStore = create<InstalledState>((set, get) => {
  const setErrorFromUnknown = (err: unknown) => {
    set({ error: err instanceof Error ? err.message : String(err) });
  };

  const getInstalledLists = async () => {
    const [modsResponse, mapsResponse] = await Promise.all([
      GetInstalledModsResponse(),
      GetInstalledMapsResponse(),
    ]);
    if (modsResponse.status !== 'success') {
      throw new Error(modsResponse.message || 'Failed to load installed mods');
    }
    if (mapsResponse.status !== 'success') {
      throw new Error(mapsResponse.message || 'Failed to load installed maps');
    }

    return {
      installedMods: modsResponse.mods || [],
      installedMaps: mapsResponse.maps || [],
    };
  };

  const setOperationStateForIds = (
    key: 'installing' | 'uninstalling',
    ids: string[],
    active: boolean,
  ) => {
    set((state) => {
      const next = new Set(state[key]);
      for (const id of ids) {
        if (active) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }

      return { [key]: next } as Pick<InstalledState, typeof key>;
    });
  };

  const startInstallOperations = (
    operations: Array<{ id: string; requestedVersion: string | null }>,
  ) => {
    if (operations.length === 0) {
      return;
    }

    useDownloadQueueStore.getState().enqueue();
    const ids = operations.map((operation) => operation.id);

    set((state) => {
      // Store requested version and rollback version for each pending install operation
      const newInstallOperations = { ...state.installOperationsById };
      for (const operation of operations) {
        // Rollback version is the currently installed version
        newInstallOperations[operation.id] = {
          requestedVersion: operation.requestedVersion,
          rollbackVersion: get().getInstalledVersion(operation.id),
        };
      }
      return { installOperationsById: newInstallOperations };
    });

    setOperationStateForIds('installing', ids, true);
    set({ error: null });
  };

  const finalizeInstallOperations = (ids: string[]) => {
    if (ids.length === 0) {
      return;
    }

    // Clear pending install state / operations for the provided IDs
    setOperationStateForIds('installing', ids, false);
    set((state) => {
      const newInstallOperations = { ...state.installOperationsById };
      for (const id of ids) {
        delete newInstallOperations[id];
      }
      return { installOperationsById: newInstallOperations };
    });
    useDownloadQueueStore.getState().complete();
  };

  const applySubscribeSubscriptionMutation = async (
    assets: Record<string, types.SubscriptionUpdateItem>,
    replaceOnConflict = false,
  ) => {
    if (Object.keys(assets).length === 0) {
      throw new Error('No assets provided for subscription update');
    }

    const result = await mutateSubscriptionsForActiveProfile({
      assets,
      action: 'subscribe',
      applyMode: 'persist_and_sync',
      replaceOnConflict,
    });
    if (result.status === 'warn' && (result.conflicts?.length ?? 0) > 0) {
      throw new AssetConflictError(
        resolveSubscriptionSyncMessage(result, 'Asset conflict detected'),
        result.conflicts ?? [],
        result,
      );
    }
    if (result.status === 'error') {
      throw new SubscriptionSyncError(
        resolveSubscriptionSyncMessage(result, 'Subscription update failed'),
        result.status,
        result.errors ?? [],
      );
    }
    return result;
  };

  const applyUnsubscribeSubscriptionMutation = async (
    assets: Record<string, types.SubscriptionUpdateItem>,
  ) => {
    if (Object.keys(assets).length === 0) {
      throw new Error('No assets provided for subscription update');
    }

    const result = await mutateSubscriptionsForActiveProfile({
      assets,
      action: 'unsubscribe',
      applyMode: 'persist_and_sync',
    });
    if (result.status === 'error') {
      throw new SubscriptionSyncError(
        resolveSubscriptionSyncMessage(result, 'Subscription update failed'),
        result.status,
        result.errors ?? [],
      );
    }
    return result;
  };

  const installAsset = async (
    id: string,
    version: string,
    assetType: AssetType,
    replaceOnConflict = false,
  ) => {
    startInstallOperations([{ id, requestedVersion: version }]);

    try {
      const response = await applySubscribeSubscriptionMutation(
        {
          [id]: new types.SubscriptionUpdateItem({
            version,
            type: assetType,
          }),
        },
        replaceOnConflict,
      );
      set({ ...(await getInstalledLists()) });
      return response;
    } catch (err) {
      setErrorFromUnknown(err);
      throw err;
    } finally {
      finalizeInstallOperations([id]);
    }
  };

  const uninstallAssets = async (
    assets: Array<{ id: string; type: AssetType }>,
  ) => {
    if (assets.length === 0) {
      throw new Error('No assets provided for uninstall');
    }

    const ids = assets.map((asset) => asset.id);
    const subscriptionAssets = assets.reduce<
      Record<string, types.SubscriptionUpdateItem>
    >((accumulator, asset) => {
      accumulator[asset.id] = new types.SubscriptionUpdateItem({
        version: '',
        type: asset.type,
      });
      return accumulator;
    }, {});

    setOperationStateForIds('uninstalling', ids, true);
    set({ error: null });

    try {
      const response =
        await applyUnsubscribeSubscriptionMutation(subscriptionAssets);
      set({ ...(await getInstalledLists()) });
      return response;
    } catch (err) {
      setErrorFromUnknown(err);
      throw err;
    } finally {
      setOperationStateForIds('uninstalling', ids, false);
    }
  };

  const updateAssetsToLatest = async (
    assets: Array<{ id: string; type: AssetType }>,
  ) => {
    if (assets.length === 0) {
      throw new Error('No assets provided for update');
    }

    const ids = assets.map((asset) => asset.id);
    startInstallOperations(ids.map((id) => ({ id, requestedVersion: null })));

    try {
      const result = await applyLatestSubscriptionUpdatesForActiveProfile({
        targets: assets,
      });
      if (result.status === 'error') {
        throw new SubscriptionSyncError(
          resolveSubscriptionSyncMessage(result, 'Subscription update failed'),
          result.status,
          result.errors ?? [],
        );
      }

      set({ ...(await getInstalledLists()) });
      return result;
    } catch (err) {
      setErrorFromUnknown(err);
      throw err;
    } finally {
      finalizeInstallOperations(ids);
    }
  };

  const importMapFromZip = async (
    zipPath: string,
    replaceOnConflict = false,
  ) => {
    set({ error: null });

    try {
      const result = await importAssetForActiveProfile({
        assetType: 'map',
        zipPath,
        replaceOnConflict,
      });
      if (result.status === 'warn' && (result.conflicts?.length ?? 0) > 0) {
        throw new AssetConflictError(
          resolveSubscriptionSyncMessage(result, 'Asset conflict detected'),
          result.conflicts ?? [],
          result,
        );
      }
      if (result.status === 'error') {
        if (hasInvalidMapCodeError(result.errors)) {
          throw new InvalidMapCodeError(
            resolveSubscriptionSyncMessage(result, 'Invalid map code'),
            result.errors ?? [],
          );
        }
        throw new SubscriptionSyncError(
          resolveSubscriptionSyncMessage(result, 'Asset import failed'),
          result.status,
          result.errors ?? [],
        );
      }

      set({ ...(await getInstalledLists()) });
      return result;
    } catch (err) {
      setErrorFromUnknown(err);
      throw err;
    }
  };

  return {
    installedMods: [],
    installedMaps: [],
    installing: new Set<string>(),
    installOperationsById: {},
    uninstalling: new Set<string>(),
    loading: false,
    error: null,
    initialized: false,

    initialize: async () => {
      if (get().initialized) return;
      set({ loading: true, error: null });
      try {
        set({
          ...(await getInstalledLists()),
          initialized: true,
          loading: false,
        });
      } catch (err) {
        setErrorFromUnknown(err);
        set({ loading: false });
      }
    },

    updateInstalledLists: async () => {
      set({ loading: true, error: null });
      try {
        set({ ...(await getInstalledLists()), loading: false });
      } catch (err) {
        setErrorFromUnknown(err);
        set({ loading: false });
      }
    },

    installMod: (id: string, version: string) =>
      installAsset(id, version, 'mod'),

    installMap: (id: string, version: string, replaceOnConflict = false) =>
      installAsset(id, version, 'map', replaceOnConflict),

    uninstallMod: (id: string) => uninstallAssets([{ id, type: 'mod' }]),

    uninstallMap: (id: string) => uninstallAssets([{ id, type: 'map' }]),

    uninstallAssets,

    updateAssetsToLatest,

    importMapFromZip,

    cancelPendingInstall: async (type: AssetType, id: string) => {
      set({ error: null });

      const operation = get().installOperationsById[id];
      const rollbackVersion = operation
        ? operation.rollbackVersion
        : get().getInstalledVersion(id);

      try {
        // Attempt to cancel pending install or uninstall
        const cancelResult = await cancelInstallForAsset({
          assetType: type,
          assetId: id,
        });
        if (cancelResult.status === 'error') {
          throw new Error(
            cancelResult.message || 'Failed to cancel pending install',
          );
        }

        // If cancellation was successful but the asset was already installed, attempt to restore the subscription to maintain the installed state.
        const shouldRestoreInstalledVersion = rollbackVersion !== null;
        const applyMode = shouldRestoreInstalledVersion
          ? 'persist_and_sync'
          : 'persist_only';
        const mutationResult = await mutateSubscriptionsForActiveProfile({
          assets: {
            [id]: new types.SubscriptionUpdateItem({
              type,
              version: rollbackVersion ?? '',
            }),
          },
          action: shouldRestoreInstalledVersion ? 'subscribe' : 'unsubscribe',
          applyMode,
        });

        if (mutationResult.status === 'error') {
          throw new SubscriptionSyncError(
            resolveSubscriptionSyncMessage(
              mutationResult,
              'Failed to persist cancellation state',
            ),
            mutationResult.status,
            mutationResult.errors,
          );
        }

        set({ ...(await getInstalledLists()) });
        return mutationResult;
      } catch (err) {
        setErrorFromUnknown(err);
        throw err;
      }
    },

    acknowledgeCancelledInstall: (id: string) => {
      set((state) => {
        if (!state.installing.has(id)) {
          return state;
        }
        const nextInstalling = new Set(state.installing);
        nextInstalling.delete(id);
        const nextInstallOperationsById = { ...state.installOperationsById };
        delete nextInstallOperationsById[id];
        return {
          installing: nextInstalling,
          installOperationsById: nextInstallOperationsById,
        };
      });
    },

    isInstalled: (id: string) => {
      const { installedMods, installedMaps } = get();
      return (
        installedMods.some((m) => m.id === id) ||
        installedMaps.some((m) => m.id === id)
      );
    },

    getInstalledVersion: (id: string) => {
      const { installedMods, installedMaps } = get();
      const mod = installedMods.find((m) => m.id === id);
      if (mod) return mod.version;
      const map = installedMaps.find((m) => m.id === id);
      if (map) return map.version;
      return null;
    },

    isOperating: (id: string) => {
      return get().installing.has(id) || get().uninstalling.has(id);
    },

    isInstalling: (id: string) => get().installing.has(id),

    getInstallingVersion: (id: string) =>
      get().installOperationsById[id]?.requestedVersion ?? null,

    isUninstalling: (id: string) => get().uninstalling.has(id),
  };
});
