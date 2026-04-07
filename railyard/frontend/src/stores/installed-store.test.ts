import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AssetType } from '@/lib/asset-types';
import {
  activeProfileResultSuccess,
  updateSubscriptionsError,
  updateSubscriptionsSuccess,
  updateSubscriptionsWarn,
  updateSubscriptionsWithConflicts,
} from '@/test/helpers/profileMutationFixtures';

import { types } from '../../wailsjs/go/models';
import { useDownloadQueueStore } from './download-queue-store';
import { useGameStore } from './game-store';
import {
  AssetConflictError,
  InvalidMapCodeError,
  SubscriptionMutationLockedError,
  SubscriptionSyncError,
  useInstalledStore,
} from './installed-store';

const {
  mockGetInstalledModsResponse,
  mockGetInstalledMapsResponse,
  mockGetActiveProfile,
  mockUpdateSubscriptions,
  mockImportAsset,
  mockUpdateSubscriptionsToLatest,
  mockCancelInstall,
} = vi.hoisted(() => ({
  mockGetInstalledModsResponse: vi.fn(),
  mockGetInstalledMapsResponse: vi.fn(),
  mockGetActiveProfile: vi.fn(),
  mockUpdateSubscriptions: vi.fn(),
  mockImportAsset: vi.fn(),
  mockUpdateSubscriptionsToLatest: vi.fn(),
  mockCancelInstall: vi.fn(),
}));

vi.mock('../../wailsjs/go/registry/Registry', () => ({
  GetInstalledModsResponse: mockGetInstalledModsResponse,
  GetInstalledMapsResponse: mockGetInstalledMapsResponse,
}));

vi.mock('../../wailsjs/go/profiles/UserProfiles', () => ({
  GetActiveProfile: mockGetActiveProfile,
  UpdateSubscriptions: mockUpdateSubscriptions,
  ImportAsset: mockImportAsset,
  UpdateSubscriptionsToLatest: mockUpdateSubscriptionsToLatest,
}));

vi.mock('../../wailsjs/go/downloader/Downloader', () => ({
  CancelInstall: mockCancelInstall,
}));

type ProfilesRequest = {
  profileId: string;
  action: 'subscribe' | 'unsubscribe';
  assetId: string;
  assetType: AssetType;
  version: string;
  applyMode?: string;
};

function validateProfilesRequest(expected: ProfilesRequest) {
  expect(mockUpdateSubscriptions).toHaveBeenCalledTimes(1);
  const request = mockUpdateSubscriptions.mock.calls[0][0];
  expect(request.profileId).toBe(expected.profileId);
  expect(request.action).toBe(expected.action);
  expect(request.applyMode).toBe(expected.applyMode ?? 'persist_and_sync');
  expect(request.assets[expected.assetId].type).toBe(expected.assetType);
  expect(request.assets[expected.assetId].version).toBe(expected.version);
}

function validateInstallationRefreshes(expectedCalls: number) {
  expect(mockGetInstalledModsResponse).toHaveBeenCalledTimes(expectedCalls);
  expect(mockGetInstalledMapsResponse).toHaveBeenCalledTimes(expectedCalls);
}

function validateFinalState(
  lane: 'installing' | 'uninstalling',
  assetId: string,
  error: string | null,
) {
  const state = useInstalledStore.getState();
  expect(state[lane].has(assetId)).toBe(false);
  if (error === null) {
    expect(state.error).toBeNull();
  } else {
    expect(state.error).toContain(error);
  }
}

const installedListsSuccess = () => {
  mockGetInstalledModsResponse.mockResolvedValue({
    status: 'success',
    message: 'ok',
    mods: [{ id: 'mod-1', version: '1.0.0' }],
  });
  mockGetInstalledMapsResponse.mockResolvedValue({
    status: 'success',
    message: 'ok',
    maps: [{ id: 'map-1', version: '2.0.0', config: { code: 'AAA' } }],
  });
};

describe('useInstalledStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInstalledStore.setState({
      installedMods: [],
      installedMaps: [],
      installing: new Set<string>(),
      installOperationsById: {},
      uninstalling: new Set<string>(),
      loading: false,
      error: null,
      initialized: false,
    });
    useDownloadQueueStore.setState({ total: 0, completed: 0 });
    useGameStore.setState({ running: false });
    mockUpdateSubscriptionsToLatest.mockResolvedValue(
      updateSubscriptionsSuccess('latest apply ok'),
    );
    mockCancelInstall.mockResolvedValue({
      status: 'warn',
      message: 'cancelled pending install',
    });
  });

  it('installMap correctly updates subscriptions and refreshes installed lists', async () => {
    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    mockUpdateSubscriptions.mockResolvedValue(
      updateSubscriptionsSuccess('subscriptions updated'),
    );
    installedListsSuccess();

    await useInstalledStore.getState().installMap('map-1', '2.0.0');

    validateProfilesRequest({
      profileId: 'profile-a',
      action: 'subscribe',
      assetId: 'map-1',
      assetType: 'map',
      version: '2.0.0',
    });
    validateInstallationRefreshes(1);
    validateFinalState('installing', 'map-1', null);
  });

  it('uninstallMap correctly updates subscriptions and refreshes installed lists on success', async () => {
    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    mockUpdateSubscriptions.mockResolvedValue(
      updateSubscriptionsSuccess('subscriptions updated'),
    );
    mockGetInstalledModsResponse.mockResolvedValue({
      status: 'success',
      message: 'ok',
      mods: [{ id: 'mod-1', version: '1.0.0' }],
    });
    mockGetInstalledMapsResponse.mockResolvedValue({
      status: 'success',
      message: 'ok',
      maps: [],
    });

    await useInstalledStore.getState().uninstallMap('map-7');

    validateProfilesRequest({
      profileId: 'profile-a',
      action: 'unsubscribe',
      assetId: 'map-7',
      assetType: 'map',
      version: '',
    });
    validateInstallationRefreshes(1);
    validateFinalState('uninstalling', 'map-7', null);
  });

  it('installMod throws SubscriptionSyncError when profile mutation fails', async () => {
    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    mockUpdateSubscriptions.mockResolvedValue(
      updateSubscriptionsError('Install failed'),
    );

    await expect(
      useInstalledStore.getState().installMod('mod-2', '1.2.3'),
    ).rejects.toThrow('Install failed');

    validateProfilesRequest({
      profileId: 'profile-a',
      action: 'subscribe',
      assetId: 'mod-2',
      assetType: 'mod',
      version: '1.2.3',
    });
    validateInstallationRefreshes(0);
    validateFinalState('installing', 'mod-2', 'Install failed');
  });

  it('installMod throws SubscriptionSyncError instance on error', async () => {
    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    mockUpdateSubscriptions.mockResolvedValue(
      updateSubscriptionsError('Sync error'),
    );

    await expect(
      useInstalledStore.getState().installMod('mod-3', '1.0.0'),
    ).rejects.toBeInstanceOf(SubscriptionSyncError);
  });

  it('installMap resolves when profile mutation returns warn', async () => {
    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    mockUpdateSubscriptions.mockResolvedValue(
      updateSubscriptionsWarn('sync completed with warnings'),
    );
    installedListsSuccess();

    const result = await useInstalledStore
      .getState()
      .installMap('map-1', '2.0.0');

    validateProfilesRequest({
      profileId: 'profile-a',
      action: 'subscribe',
      assetId: 'map-1',
      assetType: 'map',
      version: '2.0.0',
    });
    validateInstallationRefreshes(1);
    validateFinalState('installing', 'map-1', null);
    expect(result.status).toBe('warn');
    expect(result.message).toContain('sync completed with warnings');
  });

  it('installMap throws AssetConflictError when warn has conflicts', async () => {
    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    mockUpdateSubscriptions.mockResolvedValue(
      updateSubscriptionsWithConflicts('Map code conflict', [
        {
          existingAssetId: 'map-other',
          existingAssetType: 'map',
          existingVersion: '1.0.0',
          existingIsLocal: false,
          cityCode: 'ABC',
        },
      ]),
    );

    await expect(
      useInstalledStore.getState().installMap('map-1', '2.0.0'),
    ).rejects.toBeInstanceOf(AssetConflictError);

    validateFinalState('installing', 'map-1', 'Map code conflict');
  });

  it('uninstallMod throws SubscriptionSyncError when profile mutation fails', async () => {
    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    mockUpdateSubscriptions.mockResolvedValue(
      updateSubscriptionsError('Uninstall failed'),
    );

    await expect(
      useInstalledStore.getState().uninstallMod('mod-9'),
    ).rejects.toThrow('Uninstall failed');

    validateProfilesRequest({
      profileId: 'profile-a',
      action: 'unsubscribe',
      assetId: 'mod-9',
      assetType: 'mod',
      version: '',
    });
    validateInstallationRefreshes(0);
    validateFinalState('uninstalling', 'mod-9', 'Uninstall failed');
  });

  it('cancelPendingInstall cancels downloader install and restores installed version in profile state', async () => {
    useInstalledStore.setState((state) => ({
      ...state,
      installedMaps: [
        new types.InstalledMapInfo({
          id: 'map-42',
          version: '1.0.0',
          isLocal: false,
          config: { code: 'QAZ' },
        }),
      ],
    }));

    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    mockCancelInstall.mockResolvedValue({
      status: 'warn',
      message: 'cancelled pending install',
    });
    mockUpdateSubscriptions.mockResolvedValue(
      updateSubscriptionsSuccess('rollback applied'),
    );
    mockGetInstalledModsResponse.mockResolvedValue({
      status: 'success',
      message: 'ok',
      mods: [],
    });
    mockGetInstalledMapsResponse.mockResolvedValue({
      status: 'success',
      message: 'ok',
      maps: [],
    });

    const result = await useInstalledStore
      .getState()
      .cancelPendingInstall('map', 'map-42');

    expect(mockCancelInstall).toHaveBeenCalledTimes(1);
    expect(mockCancelInstall).toHaveBeenCalledWith('map', 'map-42');
    validateProfilesRequest({
      profileId: 'profile-a',
      action: 'subscribe',
      assetId: 'map-42',
      assetType: 'map',
      version: '1.0.0',
      applyMode: 'persist_and_sync',
    });
    validateInstallationRefreshes(1);
    validateFinalState('installing', 'map-42', null);
    expect(result.status).toBe('success');
  });

  it('cancelPendingInstall restores from rollback snapshot when installed list is already empty', async () => {
    useInstalledStore.setState((state) => ({
      ...state,
      installOperationsById: {
        'map-42': { requestedVersion: null, rollbackVersion: '1.0.0' },
      },
      installedMaps: [],
    }));

    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    mockCancelInstall.mockResolvedValue({
      status: 'warn',
      message: 'cancelled pending install',
    });
    mockUpdateSubscriptions.mockResolvedValue(
      updateSubscriptionsSuccess('rollback applied'),
    );
    mockGetInstalledModsResponse.mockResolvedValue({
      status: 'success',
      message: 'ok',
      mods: [],
    });
    mockGetInstalledMapsResponse.mockResolvedValue({
      status: 'success',
      message: 'ok',
      maps: [],
    });

    const result = await useInstalledStore
      .getState()
      .cancelPendingInstall('map', 'map-42');

    validateProfilesRequest({
      profileId: 'profile-a',
      action: 'subscribe',
      assetId: 'map-42',
      assetType: 'map',
      version: '1.0.0',
      applyMode: 'persist_and_sync',
    });
    expect(result.status).toBe('success');
  });

  it('cancelPendingInstall persists unsubscribe without sync when no installed version exists', async () => {
    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    mockCancelInstall.mockResolvedValue({
      status: 'warn',
      message: 'cancelled pending install',
    });
    mockUpdateSubscriptions.mockResolvedValue(
      updateSubscriptionsSuccess('rollback applied'),
    );
    mockGetInstalledModsResponse.mockResolvedValue({
      status: 'success',
      message: 'ok',
      mods: [],
    });
    mockGetInstalledMapsResponse.mockResolvedValue({
      status: 'success',
      message: 'ok',
      maps: [],
    });

    const result = await useInstalledStore
      .getState()
      .cancelPendingInstall('map', 'map-new');

    expect(mockCancelInstall).toHaveBeenCalledWith('map', 'map-new');
    validateProfilesRequest({
      profileId: 'profile-a',
      action: 'unsubscribe',
      assetId: 'map-new',
      assetType: 'map',
      version: '',
      applyMode: 'persist_only',
    });
    expect(result.status).toBe('success');
  });

  it('acknowledgeCancelledInstall removes item from installing lane idempotently', () => {
    useInstalledStore.setState((state) => ({
      ...state,
      installing: new Set(['map-1', 'map-2']),
      installOperationsById: {
        'map-1': { requestedVersion: '1.0.0', rollbackVersion: '0.9.0' },
        'map-2': { requestedVersion: '2.0.0', rollbackVersion: null },
      },
    }));

    useInstalledStore.getState().acknowledgeCancelledInstall('map-1');
    expect(useInstalledStore.getState().installing.has('map-1')).toBe(false);
    expect(
      useInstalledStore.getState().getInstallingVersion('map-1'),
    ).toBeNull();
    expect(useInstalledStore.getState().installing.has('map-2')).toBe(true);
    expect(useInstalledStore.getState().getInstallingVersion('map-2')).toBe(
      '2.0.0',
    );
    expect(useInstalledStore.getState().installOperationsById['map-1']).toBe(
      undefined,
    );

    useInstalledStore.getState().acknowledgeCancelledInstall('missing-map');
    expect(useInstalledStore.getState().installing.has('map-2')).toBe(true);
  });

  it('uninstallAssets removes multiple assets in one request', async () => {
    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    mockUpdateSubscriptions.mockResolvedValue(
      updateSubscriptionsSuccess('batch uninstall ok'),
    );
    mockGetInstalledModsResponse.mockResolvedValue({
      status: 'success',
      message: 'ok',
      mods: [],
    });
    mockGetInstalledMapsResponse.mockResolvedValue({
      status: 'success',
      message: 'ok',
      maps: [],
    });

    const result = await useInstalledStore.getState().uninstallAssets([
      { id: 'mod-1', type: 'mod' },
      { id: 'map-1', type: 'map' },
    ]);

    expect(mockUpdateSubscriptions).toHaveBeenCalledTimes(1);
    const request = mockUpdateSubscriptions.mock.calls[0][0];
    expect(request.action).toBe('unsubscribe');
    expect(request.assets['mod-1'].type).toBe('mod');
    expect(request.assets['map-1'].type).toBe('map');
    validateInstallationRefreshes(1);
    expect(result.status).toBe('success');
    expect(useInstalledStore.getState().uninstalling.has('mod-1')).toBe(false);
    expect(useInstalledStore.getState().uninstalling.has('map-1')).toBe(false);
  });

  it('updateAssetsToLatest invokes latest_apply with scoped targets and refreshes lists', async () => {
    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    installedListsSuccess();

    const result = await useInstalledStore.getState().updateAssetsToLatest([
      { id: 'map-1', type: 'map' },
      { id: 'mod-1', type: 'mod' },
    ]);

    expect(mockUpdateSubscriptionsToLatest).toHaveBeenCalledTimes(1);
    const request = mockUpdateSubscriptionsToLatest.mock.calls[0][0];
    expect(request.profileId).toBe('profile-a');
    expect(request.apply).toBe(true);
    expect(request.targets).toEqual([
      { assetId: 'map-1', type: 'map' },
      { assetId: 'mod-1', type: 'mod' },
    ]);
    validateInstallationRefreshes(1);
    expect(useInstalledStore.getState().installing.has('map-1')).toBe(false);
    expect(useInstalledStore.getState().installing.has('mod-1')).toBe(false);
    expect(result.status).toBe('success');
  });

  it('updateAssetsToLatest surfaces latest_apply errors', async () => {
    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    mockUpdateSubscriptionsToLatest.mockResolvedValue(
      updateSubscriptionsError('Failed to apply latest updates'),
    );

    await expect(
      useInstalledStore
        .getState()
        .updateAssetsToLatest([{ id: 'map-1', type: 'map' }]),
    ).rejects.toThrow('Failed to apply latest updates');
    expect(useInstalledStore.getState().installing.has('map-1')).toBe(false);
  });

  it('importMapFromZip succeeds and refreshes installed lists', async () => {
    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    mockImportAsset.mockResolvedValue({
      status: 'success',
      message: 'imported ok',
      conflicts: [],
      errors: [],
    });
    installedListsSuccess();

    const result = await useInstalledStore
      .getState()
      .importMapFromZip('/path/to/map.zip');

    expect(mockImportAsset).toHaveBeenCalledTimes(1);
    const request = mockImportAsset.mock.calls[0][0];
    expect(request.profileId).toBe('profile-a');
    expect(request.assetType).toBe('map');
    expect(request.zipPath).toBe('/path/to/map.zip');
    expect(request.replaceOnConflict).toBe(false);
    validateInstallationRefreshes(1);
    expect(result.status).toBe('success');
    expect(useInstalledStore.getState().error).toBeNull();
  });

  it('importMapFromZip throws AssetConflictError on warn with conflicts', async () => {
    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    mockImportAsset.mockResolvedValue({
      status: 'warn',
      message: 'conflict detected',
      conflicts: [
        {
          existingAssetId: 'map-other',
          existingAssetType: 'map',
          existingVersion: '1.0.0',
          existingIsLocal: false,
          cityCode: 'ABC',
        },
      ],
      errors: [],
    });

    await expect(
      useInstalledStore.getState().importMapFromZip('/path/to/map.zip'),
    ).rejects.toBeInstanceOf(AssetConflictError);
  });

  it('importMapFromZip throws InvalidMapCodeError on invalid map code error', async () => {
    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    mockImportAsset.mockResolvedValue({
      status: 'error',
      message: 'Invalid map code',
      conflicts: [],
      errors: [
        {
          downloaderErrorType: 'install_invalid_map_code',
          message: 'bad code',
        },
      ],
    });

    await expect(
      useInstalledStore.getState().importMapFromZip('/path/to/map.zip'),
    ).rejects.toBeInstanceOf(InvalidMapCodeError);
  });

  it('importMapFromZip throws SubscriptionSyncError on generic error', async () => {
    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    mockImportAsset.mockResolvedValue({
      status: 'error',
      message: 'Import failed',
      conflicts: [],
      errors: [],
    });

    await expect(
      useInstalledStore.getState().importMapFromZip('/path/to/map.zip'),
    ).rejects.toBeInstanceOf(SubscriptionSyncError);
  });

  it('importMapFromZip passes replaceOnConflict flag to the request', async () => {
    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );
    mockImportAsset.mockResolvedValue({
      status: 'success',
      message: 'ok',
      conflicts: [],
      errors: [],
    });
    installedListsSuccess();

    await useInstalledStore
      .getState()
      .importMapFromZip('/path/to/map.zip', true);

    const request = mockImportAsset.mock.calls[0][0];
    expect(request.replaceOnConflict).toBe(true);
  });

  it('tracks installingVersion for the duration of an install', async () => {
    mockGetActiveProfile.mockResolvedValue(
      activeProfileResultSuccess('profile-a'),
    );

    let versionDuringInstall: string | null = null;

    mockUpdateSubscriptions.mockImplementation(async () => {
      versionDuringInstall = useInstalledStore
        .getState()
        .getInstallingVersion('mod-5');
      return updateSubscriptionsSuccess('ok');
    });
    mockGetInstalledModsResponse.mockResolvedValue({
      status: 'success',
      message: 'ok',
      mods: [{ id: 'mod-5', version: '3.0.0' }],
    });
    mockGetInstalledMapsResponse.mockResolvedValue({
      status: 'success',
      message: 'ok',
      maps: [],
    });

    await useInstalledStore.getState().installMod('mod-5', '3.0.0');

    expect(versionDuringInstall).toBe('3.0.0');
    expect(
      useInstalledStore.getState().getInstallingVersion('mod-5'),
    ).toBeNull();
  });

  it('blocks install while game is running', async () => {
    useGameStore.setState({ running: true });

    await expect(
      useInstalledStore.getState().installMod('mod-1', '1.0.0'),
    ).rejects.toBeInstanceOf(SubscriptionMutationLockedError);

    expect(mockUpdateSubscriptions).not.toHaveBeenCalled();
  });

  it('blocks uninstall while game is running', async () => {
    useGameStore.setState({ running: true });

    await expect(
      useInstalledStore
        .getState()
        .uninstallAssets([{ id: 'map-1', type: 'map' }]),
    ).rejects.toBeInstanceOf(SubscriptionMutationLockedError);

    expect(mockUpdateSubscriptions).not.toHaveBeenCalled();
  });

  it('blocks latest updates while game is running', async () => {
    useGameStore.setState({ running: true });

    await expect(
      useInstalledStore
        .getState()
        .updateAssetsToLatest([{ id: 'mod-1', type: 'mod' }]),
    ).rejects.toBeInstanceOf(SubscriptionMutationLockedError);

    expect(mockUpdateSubscriptionsToLatest).not.toHaveBeenCalled();
  });

  it('blocks local import while game is running', async () => {
    useGameStore.setState({ running: true });

    await expect(
      useInstalledStore.getState().importMapFromZip('/tmp/map.zip'),
    ).rejects.toBeInstanceOf(SubscriptionMutationLockedError);

    expect(mockImportAsset).not.toHaveBeenCalled();
  });

  it('blocks cancel-pending while game is running', async () => {
    useGameStore.setState({ running: true });

    await expect(
      useInstalledStore.getState().cancelPendingInstall('mod', 'mod-2'),
    ).rejects.toBeInstanceOf(SubscriptionMutationLockedError);

    expect(mockUpdateSubscriptions).not.toHaveBeenCalled();
  });
});
