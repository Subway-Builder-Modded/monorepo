import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameStore } from '@/stores/game-store';

const {
  mockUpdateSubscriptions,
  mockUpdateSubscriptionsToLatest,
  mockImportAsset,
  mockCancelInstall,
  mockResolveActiveProfileID,
  mockToLatestUpdateRequestTargets,
} = vi.hoisted(() => ({
  mockUpdateSubscriptions: vi.fn(),
  mockUpdateSubscriptionsToLatest: vi.fn(),
  mockImportAsset: vi.fn(),
  mockCancelInstall: vi.fn(),
  mockResolveActiveProfileID: vi.fn(),
  mockToLatestUpdateRequestTargets: vi.fn(),
}));

vi.mock('../../wailsjs/go/profiles/UserProfiles', () => ({
  UpdateSubscriptions: mockUpdateSubscriptions,
  UpdateSubscriptionsToLatest: mockUpdateSubscriptionsToLatest,
  ImportAsset: mockImportAsset,
}));

vi.mock('../../wailsjs/go/downloader/Downloader', () => ({
  CancelInstall: mockCancelInstall,
}));

vi.mock('@/lib/subscription-updates', () => ({
  resolveActiveProfileID: mockResolveActiveProfileID,
  toLatestUpdateRequestTargets: mockToLatestUpdateRequestTargets,
}));

import {
  applyLatestSubscriptionUpdatesForActiveProfile,
  cancelInstallForAsset,
  importAssetForActiveProfile,
  isSubscriptionMutationLockedError,
  mutateSubscriptionsForActiveProfile,
  SubscriptionMutationLockedError,
} from '@/lib/subscription-mutation-client';

import { types } from '../../wailsjs/go/models';

describe('subscription-mutation-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.setState({ running: false });
    mockResolveActiveProfileID.mockResolvedValue('profile-a');
    mockToLatestUpdateRequestTargets.mockReturnValue([
      { assetId: 'map-1', type: 'map' },
    ]);
  });

  it('blocks mutation calls while game is running', async () => {
    useGameStore.setState({ running: true });

    await expect(
      mutateSubscriptionsForActiveProfile({
        assets: {
          'map-1': new types.SubscriptionUpdateItem({
            type: 'map',
            version: 'v1.0.0',
          }),
        },
        action: 'subscribe',
        applyMode: 'persist_and_sync',
      }),
    ).rejects.toBeInstanceOf(SubscriptionMutationLockedError);

    expect(mockUpdateSubscriptions).not.toHaveBeenCalled();
    expect(mockResolveActiveProfileID).not.toHaveBeenCalled();
  });

  it('delegates unlocked mutation calls to UpdateSubscriptions', async () => {
    mockUpdateSubscriptions.mockResolvedValue({
      status: 'success',
      message: 'ok',
    });

    await mutateSubscriptionsForActiveProfile({
      assets: {
        'map-1': new types.SubscriptionUpdateItem({
          type: 'map',
          version: 'v1.0.0',
        }),
      },
      action: 'subscribe',
      applyMode: 'persist_and_sync',
      replaceOnConflict: true,
    });
    await mutateSubscriptionsForActiveProfile({
      assets: {
        'mod-1': new types.SubscriptionUpdateItem({
          type: 'mod',
          version: '',
        }),
      },
      action: 'unsubscribe',
      applyMode: 'persist_and_sync',
    });
    await mutateSubscriptionsForActiveProfile({
      assets: {
        'map-2': new types.SubscriptionUpdateItem({
          type: 'map',
          version: 'v2.0.0',
        }),
      },
      action: 'subscribe',
      applyMode: 'persist_only',
    });

    expect(mockResolveActiveProfileID).toHaveBeenCalledTimes(3);
    expect(mockUpdateSubscriptions).toHaveBeenCalledTimes(3);
    const [subscribeRequest, unsubscribeRequest, persistRequest] =
      mockUpdateSubscriptions.mock.calls.map((call) => call[0]);
    expect(subscribeRequest.profileId).toBe('profile-a');
    expect(subscribeRequest.action).toBe('subscribe');
    expect(subscribeRequest.applyMode).toBe('persist_and_sync');
    expect(subscribeRequest.replaceOnConflict).toBe(true);
    expect(unsubscribeRequest.action).toBe('unsubscribe');
    expect(unsubscribeRequest.applyMode).toBe('persist_and_sync');
    expect(persistRequest.action).toBe('subscribe');
    expect(persistRequest.applyMode).toBe('persist_only');
  });

  it('delegates unlocked latest apply and import calls', async () => {
    mockUpdateSubscriptionsToLatest.mockResolvedValue({
      status: 'success',
      message: 'ok',
    });
    mockImportAsset.mockResolvedValue({
      status: 'success',
      message: 'ok',
    });
    mockCancelInstall.mockResolvedValue({
      status: 'warn',
      message: 'cancelled',
    });

    await applyLatestSubscriptionUpdatesForActiveProfile({
      targets: [{ id: 'map-1', type: 'map' }],
    });
    await importAssetForActiveProfile({
      assetType: 'map',
      zipPath: '/tmp/map.zip',
      replaceOnConflict: false,
    });
    await cancelInstallForAsset({
      assetType: 'map',
      assetId: 'map-1',
    });

    expect(mockUpdateSubscriptionsToLatest).toHaveBeenCalledTimes(1);
    const latestRequest = mockUpdateSubscriptionsToLatest.mock.calls[0][0];
    expect(latestRequest.profileId).toBe('profile-a');
    expect(latestRequest.apply).toBe(true);
    expect(latestRequest.targets).toEqual([{ assetId: 'map-1', type: 'map' }]);

    expect(mockImportAsset).toHaveBeenCalledTimes(1);
    const importRequest = mockImportAsset.mock.calls[0][0];
    expect(importRequest.profileId).toBe('profile-a');
    expect(importRequest.assetType).toBe('map');
    expect(importRequest.zipPath).toBe('/tmp/map.zip');

    expect(mockCancelInstall).toHaveBeenCalledTimes(1);
    expect(mockCancelInstall).toHaveBeenCalledWith('map', 'map-1');
  });

  it('detects typed lock errors by class and code shape', () => {
    expect(
      isSubscriptionMutationLockedError(new SubscriptionMutationLockedError()),
    ).toBe(true);
    expect(
      isSubscriptionMutationLockedError({
        code: 'subscription_mutation_locked',
        message: 'Cannot modify subscriptions while the game is running.',
      }),
    ).toBe(true);
    expect(
      isSubscriptionMutationLockedError({
        code: 'different_code',
        message: 'nope',
      }),
    ).toBe(false);
  });
});
