import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRegistryStore } from './registry-store';

const {
  mockGetModsResponse,
  mockGetMapsResponse,
  mockRefreshResponse,
  mockGetDownloadCountsByAssetType,
} = vi.hoisted(() => ({
  mockGetModsResponse: vi.fn(),
  mockGetMapsResponse: vi.fn(),
  mockRefreshResponse: vi.fn(),
  mockGetDownloadCountsByAssetType: vi.fn(),
}));

vi.mock('../../wailsjs/go/registry/Registry', () => ({
  GetModsResponse: mockGetModsResponse,
  GetMapsResponse: mockGetMapsResponse,
  RefreshResponse: mockRefreshResponse,
  GetDownloadCountsByAssetType: mockGetDownloadCountsByAssetType,
}));

describe('useRegistryStore download totals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    useRegistryStore.setState({
      mods: [],
      maps: [],
      modDownloadTotals: {},
      mapDownloadTotals: {},
      downloadTotalsLoaded: false,
      loading: false,
      refreshing: false,
      error: null,
      initialized: false,
    });
  });

  it('loads and caches cumulative totals by asset type', async () => {
    mockGetDownloadCountsByAssetType
      .mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        assetType: 'mod',
        counts: {
          mod_a: { '1.0.0': 2, '1.1.0': 3 },
          mod_b: { '2.0.0': 7 },
        },
      })
      .mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        assetType: 'map',
        counts: {
          map_a: { '1.0.0': 11 },
        },
      });

    await useRegistryStore.getState().ensureDownloadTotals();

    const state = useRegistryStore.getState();
    expect(mockGetDownloadCountsByAssetType).toHaveBeenCalledTimes(2);
    expect(mockGetDownloadCountsByAssetType).toHaveBeenNthCalledWith(1, 'mod');
    expect(mockGetDownloadCountsByAssetType).toHaveBeenNthCalledWith(2, 'map');
    expect(state.modDownloadTotals).toEqual({ mod_a: 5, mod_b: 7 });
    expect(state.mapDownloadTotals).toEqual({ map_a: 11 });
    expect(state.downloadTotalsLoaded).toBe(true);
  });

  it('does not latch loaded when every asset type fails, so it retries', async () => {
    mockGetDownloadCountsByAssetType
      .mockResolvedValueOnce({
        status: 'error',
        message: 'failed',
        assetType: 'mod',
        counts: {},
      })
      .mockResolvedValueOnce({
        status: 'warn',
        message: 'partial',
        assetType: 'map',
        counts: {},
      })
      // A later call retries (not skipped) and succeeds.
      .mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        assetType: 'mod',
        counts: { mod_a: { '1.0.0': 3 } },
      })
      .mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        assetType: 'map',
        counts: { map_a: { '1.0.0': 5 } },
      });

    await useRegistryStore.getState().ensureDownloadTotals();
    expect(useRegistryStore.getState().modDownloadTotals).toEqual({});
    expect(useRegistryStore.getState().mapDownloadTotals).toEqual({});
    // Not latched: total failure must not cache zeros.
    expect(useRegistryStore.getState().downloadTotalsLoaded).toBe(false);

    // Because it stayed unloaded, a plain (non-forced) call refetches and recovers.
    await useRegistryStore.getState().ensureDownloadTotals();
    expect(mockGetDownloadCountsByAssetType).toHaveBeenCalledTimes(4);
    expect(useRegistryStore.getState().modDownloadTotals).toEqual({ mod_a: 3 });
    expect(useRegistryStore.getState().mapDownloadTotals).toEqual({ map_a: 5 });
    expect(useRegistryStore.getState().downloadTotalsLoaded).toBe(true);
  });

  it('preserves prior totals and stays unloaded when the request throws', async () => {
    useRegistryStore.setState({
      modDownloadTotals: { mod_a: 7 },
      mapDownloadTotals: { map_a: 8 },
      downloadTotalsLoaded: true,
    });
    mockGetDownloadCountsByAssetType.mockRejectedValue(new Error('boom'));

    await useRegistryStore.getState().ensureDownloadTotals({ force: true });

    const state = useRegistryStore.getState();
    // Not wiped to zero, and not latched so a later call retries.
    expect(state.modDownloadTotals).toEqual({ mod_a: 7 });
    expect(state.mapDownloadTotals).toEqual({ map_a: 8 });
    expect(state.downloadTotalsLoaded).toBe(false);
  });

  it('latches loaded on a partial success (at least one asset type)', async () => {
    mockGetDownloadCountsByAssetType
      .mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        assetType: 'mod',
        counts: { mod_a: { '1.0.0': 2 } },
      })
      .mockResolvedValueOnce({
        status: 'error',
        message: 'failed',
        assetType: 'map',
        counts: {},
      });

    await useRegistryStore.getState().ensureDownloadTotals();

    const state = useRegistryStore.getState();
    expect(state.modDownloadTotals).toEqual({ mod_a: 2 });
    expect(state.mapDownloadTotals).toEqual({});
    expect(state.downloadTotalsLoaded).toBe(true);
  });

  it('deduplicates concurrent totals loads with an in-flight promise', async () => {
    mockGetDownloadCountsByAssetType
      .mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        assetType: 'mod',
        counts: { mod_a: { '1.0.0': 1 } },
      })
      .mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        assetType: 'map',
        counts: { map_a: { '1.0.0': 2 } },
      });

    await Promise.all([
      useRegistryStore.getState().ensureDownloadTotals(),
      useRegistryStore.getState().ensureDownloadTotals(),
      useRegistryStore.getState().ensureDownloadTotals(),
    ]);

    expect(mockGetDownloadCountsByAssetType).toHaveBeenCalledTimes(2);
    expect(useRegistryStore.getState().downloadTotalsLoaded).toBe(true);
  });

  it('force-reload replaces totals cached empty during the startup window', async () => {
    mockGetDownloadCountsByAssetType
      // First load lands before the registry populated counts: success but empty.
      .mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        assetType: 'mod',
        counts: {},
      })
      .mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        assetType: 'map',
        counts: {},
      })
      // The forced reload (as triggered on registry:ready) sees the now-populated counts.
      .mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        assetType: 'mod',
        counts: { mod_a: { '1.0.0': 4 } },
      })
      .mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        assetType: 'map',
        counts: { map_a: { '1.0.0': 9 } },
      });

    await useRegistryStore.getState().ensureDownloadTotals();
    // Poisoned: empty totals, but marked loaded so a non-forced call will not refetch.
    expect(useRegistryStore.getState().modDownloadTotals).toEqual({});
    expect(useRegistryStore.getState().downloadTotalsLoaded).toBe(true);

    await useRegistryStore.getState().ensureDownloadTotals();
    expect(mockGetDownloadCountsByAssetType).toHaveBeenCalledTimes(2);

    // The registry:ready fix forces a refetch, which recovers the real totals.
    await useRegistryStore.getState().ensureDownloadTotals({ force: true });
    expect(mockGetDownloadCountsByAssetType).toHaveBeenCalledTimes(4);
    expect(useRegistryStore.getState().modDownloadTotals).toEqual({ mod_a: 4 });
    expect(useRegistryStore.getState().mapDownloadTotals).toEqual({ map_a: 9 });
  });

  it('skips re-fetching when totals are already loaded', async () => {
    useRegistryStore.setState({ downloadTotalsLoaded: true });
    await useRegistryStore.getState().ensureDownloadTotals();
    expect(mockGetDownloadCountsByAssetType).not.toHaveBeenCalled();
  });

  it('recomputes totals during refresh', async () => {
    useRegistryStore.setState({
      downloadTotalsLoaded: true,
      modDownloadTotals: { mod_old: 1 },
      mapDownloadTotals: { map_old: 2 },
    });

    mockRefreshResponse.mockResolvedValue({ status: 'success', message: 'ok' });
    mockGetModsResponse.mockResolvedValue({
      status: 'success',
      message: 'ok',
      mods: [],
    });
    mockGetMapsResponse.mockResolvedValue({
      status: 'success',
      message: 'ok',
      maps: [],
    });
    mockGetDownloadCountsByAssetType
      .mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        assetType: 'mod',
        counts: { mod_c: { '1.0.0': 9 } },
      })
      .mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        assetType: 'map',
        counts: { map_c: { '1.0.0': 4, '1.1.0': 6 } },
      });

    await useRegistryStore.getState().refresh();

    const state = useRegistryStore.getState();
    expect(mockRefreshResponse).toHaveBeenCalledTimes(1);
    expect(mockGetModsResponse).toHaveBeenCalledTimes(1);
    expect(mockGetMapsResponse).toHaveBeenCalledTimes(1);
    expect(state.modDownloadTotals).toEqual({ mod_c: 9 });
    expect(state.mapDownloadTotals).toEqual({ map_c: 10 });
    expect(state.downloadTotalsLoaded).toBe(true);
    expect(state.refreshing).toBe(false);
  });
});
