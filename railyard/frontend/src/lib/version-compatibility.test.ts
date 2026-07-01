import { describe, expect, it } from 'vitest';

import {
  constraintsFromVersion,
  describeConstraint,
  describeConstraintRange,
  describeConstraintRequirement,
  describeIncompatibility,
  getDownloadableVersions,
  getFailingConstraints,
  INCOMPATIBLE_GAME_VERSION_MESSAGE,
  type InstalledConstraint,
  isInstalledCompatible,
  isVersionGameCompatible,
  resolveAvailableUpdate,
  selectLatestCompatibleVersion,
} from './version-compatibility';

const MANIFEST: InstalledConstraint = { type: 'manifest', range: '>=1.0.0' };
const BUILDINGS: InstalledConstraint = {
  type: 'buildings_index',
  range: '>1.3.0',
};

describe('selectLatestCompatibleVersion', () => {
  const versions = [
    { version: '2.0.0', game_version: '>=3.0.0' },
    { version: '1.0.0', game_version: '>=1.0.0 <2.0.0' },
  ];

  it.each([
    ['unknown game version returns latest', '', '2.0.0'],
    ['selects first compatible version', '1.5.0', '1.0.0'],
    ['returns undefined when none compatible', '2.5.0', undefined],
  ] as const)('%s', (_, gameVersion, expected) => {
    expect(selectLatestCompatibleVersion(versions, gameVersion)?.version).toBe(
      expected,
    );
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

    it.each([
      ['JSON game rejects binary-only version', '1.2.0', '1.0.0'],
      ['binary game selects binary version', '1.4.0', '2.0.0'],
    ] as const)('%s', (_, gameVersion, expected) => {
      expect(
        selectLatestCompatibleVersion(mapVersions, gameVersion)?.version,
      ).toBe(expected);
    });

    it('ignores absent map_buildings_constraint', () => {
      const plain = [{ version: '1.0.0', game_version: '>=1.0.0' }];
      expect(selectLatestCompatibleVersion(plain, '1.4.0')?.version).toBe(
        '1.0.0',
      );
    });
  });
});

describe('getFailingConstraints', () => {
  it.each<[string, string, InstalledConstraint[], number]>([
    ['empty game version', '', [MANIFEST], 0],
    ['empty constraints', '1.4.0', [], 0],
    ['all constraints pass', '1.4.0', [MANIFEST, BUILDINGS], 0],
  ])('%s → returns empty', (_, gameVersion, constraints, len) => {
    expect(getFailingConstraints(gameVersion, constraints)).toHaveLength(len);
  });

  it('returns only the failing constraint', () => {
    const result = getFailingConstraints('1.2.0', [MANIFEST, BUILDINGS]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('buildings_index');
  });

  it('sorts buildings_index before manifest when both fail', () => {
    const result = getFailingConstraints('0.5.0', [MANIFEST, BUILDINGS]);
    expect(result[0].type).toBe('buildings_index');
    expect(result[1].type).toBe('manifest');
  });
});

describe('describeConstraintRange', () => {
  it.each([
    ['>=1.3.0', '1.3.0 or newer'], // includes boundary
    ['>1.3.0', 'newer than 1.3.0'], // excludes boundary
    ['<=1.3.0', '1.3.0 or older'], // includes boundary
    ['<1.3.0', 'older than 1.3.0'], // excludes boundary
    ['=1.3.0', 'exactly 1.3.0'],
    ['v>=1.3.0'.replace('v', ''), '1.3.0 or newer'],
    ['>=v1.3.0', '1.3.0 or newer'], // tolerates v prefix
    ['>=1.0.0 <2.0.0', '>=1.0.0 <2.0.0'], // compound → raw
    ['garbage', 'garbage'],
  ])('%s → %s', (range, expected) => {
    expect(describeConstraintRange(range)).toBe(expected);
  });
});

describe('describeConstraint', () => {
  it('phrases a game-version requirement', () => {
    expect(
      describeConstraint({ type: 'manifest', range: '>=1.3.0' }, '1.2.0'),
    ).toBe('Game version: needs 1.3.0 or newer (you have 1.2.0)');
  });

  it('phrases a legacy buildings requirement (inclusive)', () => {
    expect(
      describeConstraint(
        { type: 'buildings_index', range: '<=1.3.0' },
        '1.4.0',
      ),
    ).toBe('Buildings format: needs 1.3.0 or older (you have 1.4.0)');
  });
});

describe('constraintsFromVersion', () => {
  it('builds manifest + buildings constraints from a version', () => {
    expect(
      constraintsFromVersion({
        game_version: '>=1.3.0',
        map_buildings_constraint: '>1.3.0',
      }),
    ).toEqual([
      { type: 'manifest', range: '>=1.3.0' },
      { type: 'buildings_index', range: '>1.3.0' },
    ]);
  });

  it('omits absent fields', () => {
    expect(constraintsFromVersion({ game_version: '>=1.3.0' })).toEqual([
      { type: 'manifest', range: '>=1.3.0' },
    ]);
  });
});

describe('describeConstraintRequirement', () => {
  it('omits the current game version', () => {
    expect(
      describeConstraintRequirement({ type: 'manifest', range: '>=1.3.0' }),
    ).toBe('Game version: needs 1.3.0 or newer');
  });
});

describe('describeIncompatibility', () => {
  it('joins all failing constraints under the shared base sentence', () => {
    const constraints: InstalledConstraint[] = [
      { type: 'manifest', range: '>=1.3.0' },
      { type: 'buildings_index', range: '>1.3.0' },
    ];
    expect(describeIncompatibility('1.2.0', constraints)).toBe(
      `${INCOMPATIBLE_GAME_VERSION_MESSAGE}. Buildings format: needs newer than 1.3.0 (you have 1.2.0); Game version: needs 1.3.0 or newer (you have 1.2.0)`,
    );
  });

  it('is empty when fully compatible', () => {
    expect(
      describeIncompatibility('2.0.0', [
        { type: 'manifest', range: '>=1.3.0' },
      ]),
    ).toBe('');
  });
});

describe('isInstalledCompatible', () => {
  it.each<[string, string, InstalledConstraint[], boolean | null]>([
    ['unknown game version', '', [MANIFEST], null],
    ['empty constraints', '1.4.0', [], null],
    ['all constraints pass', '1.4.0', [MANIFEST, BUILDINGS], true],
    ['buildings_index fails', '1.2.0', [MANIFEST, BUILDINGS], false],
    ['only buildings_index (fails)', '1.2.0', [BUILDINGS], false],
    ['only manifest (fails)', '0.9.0', [MANIFEST], false],
  ])('%s', (_, gameVersion, constraints, expected) => {
    expect(isInstalledCompatible(gameVersion, constraints)).toBe(expected);
  });
});

describe('resolveAvailableUpdate', () => {
  it('surfaces the pending version when it is strictly newer', () => {
    expect(resolveAvailableUpdate('1.0.0', '1.2.0')).toEqual({
      targetVersion: '1.2.0',
      hasUpdate: true,
    });
  });

  it('reports no update when nothing is installed', () => {
    expect(resolveAvailableUpdate(undefined, '1.2.0')).toEqual({
      hasUpdate: false,
    });
  });

  it('reports no update when the backend suppressed it (undetected game version)', () => {
    // The pending resolution is null precisely because the game version was undetected,
    // so an installed asset must not be offered a (phantom) update.
    expect(resolveAvailableUpdate('1.0.0', null)).toEqual({ hasUpdate: false });
  });

  it('does not surface a pending version that is not strictly newer', () => {
    expect(resolveAvailableUpdate('1.2.0', '1.2.0')).toEqual({
      hasUpdate: false,
    });
    expect(resolveAvailableUpdate('1.2.0', '1.1.0')).toEqual({
      hasUpdate: false,
    });
  });
});

describe('getDownloadableVersions', () => {
  const versions = [
    { version: '2.0.0', manifest: 'm.json' },
    { version: '1.0.0' }, // no manifest asset
  ];

  it('keeps only manifest-bearing versions for mods', () => {
    const result = getDownloadableVersions('mod', versions);
    expect(result.map((v) => v.version)).toEqual(['2.0.0']);
  });

  it('keeps every version for maps', () => {
    const result = getDownloadableVersions('map', versions);
    expect(result.map((v) => v.version)).toEqual(['2.0.0', '1.0.0']);
  });
});

describe('isVersionGameCompatible', () => {
  it('is true when the game version satisfies every constraint', () => {
    expect(isVersionGameCompatible({ game_version: '>=1.0.0' }, '1.3.0')).toBe(
      true,
    );
    expect(
      isVersionGameCompatible(
        { game_version: '>=1.0.0', map_buildings_constraint: '>1.2.0' },
        '1.3.0',
      ),
    ).toBe(true);
  });

  it('is false when the manifest constraint fails', () => {
    expect(isVersionGameCompatible({ game_version: '>=1.4.0' }, '1.3.0')).toBe(
      false,
    );
  });

  it('is false when the buildings-index constraint fails', () => {
    expect(
      isVersionGameCompatible(
        { game_version: '>=1.0.0', map_buildings_constraint: '<1.3.0' },
        '1.3.0',
      ),
    ).toBe(false);
  });

  it('treats a version with no requirements as compatible', () => {
    expect(isVersionGameCompatible({ game_version: '' }, '1.3.0')).toBe(true);
  });
});
