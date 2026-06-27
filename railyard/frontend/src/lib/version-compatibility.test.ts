import { describe, expect, it } from 'vitest';

import {
  getFailingConstraints,
  isInstalledCompatible,
  selectLatestCompatibleVersion,
} from './version-compatibility';

describe('selectLatestCompatibleVersion', () => {
  const versions = [
    { version: '2.0.0', game_version: '>=3.0.0' },
    { version: '1.0.0', game_version: '>=1.0.0 <2.0.0' },
  ];

  it('returns the latest version when the game version is unknown', () => {
    expect(selectLatestCompatibleVersion(versions, '')?.version).toBe('2.0.0');
  });

  it('returns the first compatible version for the current game version', () => {
    expect(selectLatestCompatibleVersion(versions, '1.5.0')?.version).toBe(
      '1.0.0',
    );
  });

  it('does not fall back to an incompatible latest version', () => {
    expect(selectLatestCompatibleVersion(versions, '2.5.0')).toBeUndefined();
  });

  describe('map_buildings_constraint', () => {
    const mapVersions = [
      {
        version: '2.0.0',
        game_version: '>=1.0.0',
        map_buildings_constraint: '>1.3.0',
      },
      {
        version: '1.0.0',
        game_version: '>=1.0.0',
        map_buildings_constraint: '<=1.3.0',
      },
    ];

    it('rejects versions whose buildings constraint fails', () => {
      // game 1.2.0 — JSON-only game, map v2.0.0 needs binary (>1.3.0)
      expect(selectLatestCompatibleVersion(mapVersions, '1.2.0')?.version).toBe(
        '1.0.0',
      );
    });

    it('accepts versions whose buildings constraint passes', () => {
      // game 1.4.0 — binary game, map v2.0.0 ships binary (>1.3.0)
      expect(selectLatestCompatibleVersion(mapVersions, '1.4.0')?.version).toBe(
        '2.0.0',
      );
    });

    it('ignores missing map_buildings_constraint', () => {
      const plain = [{ version: '1.0.0', game_version: '>=1.0.0' }];
      expect(selectLatestCompatibleVersion(plain, '1.4.0')?.version).toBe(
        '1.0.0',
      );
    });
  });
});

describe('getFailingConstraints', () => {
  it('returns empty array when game version is unknown', () => {
    expect(
      getFailingConstraints('', [{ type: 'manifest', range: '>=1.0.0' }]),
    ).toEqual([]);
  });

  it('returns empty array when constraints list is empty', () => {
    expect(getFailingConstraints('1.4.0', [])).toEqual([]);
  });

  it('returns empty array when all constraints pass', () => {
    expect(
      getFailingConstraints('1.4.0', [
        { type: 'manifest', range: '>=1.0.0' },
        { type: 'buildings_index', range: '>1.3.0' },
      ]),
    ).toEqual([]);
  });

  it('returns only the failing constraint', () => {
    const result = getFailingConstraints('1.2.0', [
      { type: 'manifest', range: '>=1.0.0' },
      { type: 'buildings_index', range: '>1.3.0' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('buildings_index');
  });

  it('sorts buildings_index before manifest when both fail', () => {
    const result = getFailingConstraints('0.5.0', [
      { type: 'manifest', range: '>=1.0.0' },
      { type: 'buildings_index', range: '>1.3.0' },
    ]);
    expect(result[0].type).toBe('buildings_index');
    expect(result[1].type).toBe('manifest');
  });
});

describe('isInstalledCompatible', () => {
  it('returns null when game version is unknown', () => {
    expect(
      isInstalledCompatible('', [{ type: 'manifest', range: '>=1.0.0' }]),
    ).toBeNull();
  });

  it('returns null when constraints list is empty', () => {
    expect(isInstalledCompatible('1.4.0', [])).toBeNull();
  });

  it('returns true when all constraints pass', () => {
    expect(
      isInstalledCompatible('1.4.0', [
        { type: 'manifest', range: '>=1.0.0' },
        { type: 'buildings_index', range: '>1.3.0' },
      ]),
    ).toBe(true);
  });

  it('returns false when any constraint fails', () => {
    expect(
      isInstalledCompatible('1.2.0', [
        { type: 'manifest', range: '>=1.0.0' },
        { type: 'buildings_index', range: '>1.3.0' },
      ]),
    ).toBe(false);
  });

  it('returns false when only the buildings_index constraint fails', () => {
    expect(
      isInstalledCompatible('1.2.0', [
        { type: 'buildings_index', range: '>1.3.0' },
      ]),
    ).toBe(false);
  });

  it('returns false when only the manifest constraint fails', () => {
    expect(
      isInstalledCompatible('0.9.0', [{ type: 'manifest', range: '>=1.0.0' }]),
    ).toBe(false);
  });
});
