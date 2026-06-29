import { describe, expect, it } from 'vitest';

import {
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
      author: {
        author_alias: 'Author',
      },
      tags: [],
      gallery: [],
      description: '',
    } as unknown as types.ModManifest,
    ...overrides,
  } as InstalledTaggedItem;
}

describe('isInstalledItemVisibleByStatus', () => {
  const gameVersion = '1.2.0';

  it('always keeps assets with no special status visible', () => {
    expect(
      isInstalledItemVisibleByStatus(
        installedItem(),
        ['incompatible'],
        gameVersion,
      ),
    ).toBe(true);
  });

  it('hides incompatible assets when incompatible is disabled', () => {
    const item = installedItem({
      constraints: [{ type: 'manifest', range: '>2.0.0' }],
    });

    expect(
      isInstalledItemVisibleByStatus(item, ['test', 'local'], gameVersion),
    ).toBe(false);
  });

  it('keeps incompatible assets visible when incompatible is enabled', () => {
    const item = installedItem({
      constraints: [{ type: 'manifest', range: '>2.0.0' }],
    });

    expect(
      isInstalledItemVisibleByStatus(item, ['incompatible'], gameVersion),
    ).toBe(true);
  });

  it('uses OR logic when an asset matches multiple statuses', () => {
    const baseItem = installedItem();
    const item = installedItem({
      item: {
        ...(baseItem.item as types.ModManifest),
        is_test: true,
      } as types.ModManifest,
      constraints: [{ type: 'manifest', range: '>2.0.0' }],
    });

    expect(isInstalledItemVisibleByStatus(item, ['test'], gameVersion)).toBe(
      true,
    );
    expect(
      isInstalledItemVisibleByStatus(item, ['incompatible'], gameVersion),
    ).toBe(true);
  });
});
