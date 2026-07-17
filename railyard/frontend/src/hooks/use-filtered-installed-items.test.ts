import { describe, expect, it } from 'vitest';

import {
  countInstalledStatuses,
  type InstalledTaggedItem,
  isInstalledItemVisibleByStatus,
} from '@/hooks/use-filtered-installed-items';

import type { types } from '../../wailsjs/go/models';

function installedItem(
  overrides: Partial<InstalledTaggedItem> = {},
): InstalledTaggedItem {
  return {
    type: 'mod',
    installedVersion: '1.0.0',
    installedSizeBytes: 0,
    isLocal: false,
    constraints: [],
    item: {
      id: 'asset-a',
      name: 'Asset A',
      author: { author_alias: 'Author' },
      tags: [],
      gallery: [],
      description: '',
    } as unknown as types.ModManifest,
    ...overrides,
  } as InstalledTaggedItem;
}

const gameVersion = '1.2.0';

describe('isInstalledItemVisibleByStatus', () => {
  it('shows all assets when no filters are active', () => {
    const incompatibleItem = installedItem({
      constraints: [{ type: 'manifest', range: '>2.0.0' }],
    });
    expect(
      isInstalledItemVisibleByStatus(incompatibleItem, [], gameVersion),
    ).toBe(true);
    expect(
      isInstalledItemVisibleByStatus(installedItem(), [], gameVersion),
    ).toBe(true);
  });

  it('compatible filter shows only compatible assets', () => {
    const compatible = installedItem();
    const incompatible = installedItem({
      constraints: [{ type: 'manifest', range: '>2.0.0' }],
    });
    expect(
      isInstalledItemVisibleByStatus(compatible, ['compatible'], gameVersion),
    ).toBe(true);
    expect(
      isInstalledItemVisibleByStatus(incompatible, ['compatible'], gameVersion),
    ).toBe(false);
  });

  it('incompatible filter shows only incompatible assets', () => {
    const compatible = installedItem();
    const incompatible = installedItem({
      constraints: [{ type: 'manifest', range: '>2.0.0' }],
    });
    expect(
      isInstalledItemVisibleByStatus(compatible, ['incompatible'], gameVersion),
    ).toBe(false);
    expect(
      isInstalledItemVisibleByStatus(
        incompatible,
        ['incompatible'],
        gameVersion,
      ),
    ).toBe(true);
  });

  it('test filter shows only test assets', () => {
    const normal = installedItem();
    const testItem = installedItem({
      item: {
        ...(normal.item as types.ModManifest),
        is_test: true,
      } as types.ModManifest,
    });
    expect(isInstalledItemVisibleByStatus(normal, ['test'], gameVersion)).toBe(
      false,
    );
    expect(
      isInstalledItemVisibleByStatus(testItem, ['test'], gameVersion),
    ).toBe(true);
  });

  it('local filter shows only local assets', () => {
    const remote = installedItem();
    const local = installedItem({ isLocal: true });
    expect(isInstalledItemVisibleByStatus(remote, ['local'], gameVersion)).toBe(
      false,
    );
    expect(isInstalledItemVisibleByStatus(local, ['local'], gameVersion)).toBe(
      true,
    );
  });

  it('OR logic: asset matching any selected filter is visible', () => {
    const testIncompatible = installedItem({
      item: {
        ...(installedItem().item as types.ModManifest),
        is_test: true,
      } as types.ModManifest,
      constraints: [{ type: 'manifest', range: '>2.0.0' }],
    });
    expect(
      isInstalledItemVisibleByStatus(testIncompatible, ['test'], gameVersion),
    ).toBe(true);
    expect(
      isInstalledItemVisibleByStatus(
        testIncompatible,
        ['incompatible'],
        gameVersion,
      ),
    ).toBe(true);
    expect(
      isInstalledItemVisibleByStatus(
        testIncompatible,
        ['compatible'],
        gameVersion,
      ),
    ).toBe(false);
  });

  it('counts statuses over the given items, with compatible overlapping local/test', () => {
    const items = [
      installedItem(),
      installedItem({ isLocal: true }),
      installedItem({
        item: {
          ...(installedItem().item as types.ModManifest),
          is_test: true,
        } as types.ModManifest,
      }),
      installedItem({ constraints: [{ type: 'manifest', range: '>2.0.0' }] }),
    ];
    expect(countInstalledStatuses(items, gameVersion)).toEqual({
      compatible: 3,
      local: 1,
      test: 1,
      incompatible: 1,
    });
  });

  it('treats assets with no constraints (null compat) as compatible', () => {
    const noConstraints = installedItem({ constraints: [] });
    expect(
      isInstalledItemVisibleByStatus(
        noConstraints,
        ['compatible'],
        gameVersion,
      ),
    ).toBe(true);
    expect(
      isInstalledItemVisibleByStatus(
        noConstraints,
        ['incompatible'],
        gameVersion,
      ),
    ).toBe(false);
  });
});
