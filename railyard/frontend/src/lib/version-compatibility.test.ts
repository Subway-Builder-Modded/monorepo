import { describe, expect, it } from 'vitest';

import {
  isVersionInstallable,
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

  it('can require a known explicitly compatible game version', () => {
    expect(
      selectLatestCompatibleVersion(versions, '', {
        requireKnownGameVersion: true,
        requireExplicitCompatibility: true,
      }),
    ).toBeUndefined();
  });

  it('returns the first compatible version for the current game version', () => {
    expect(selectLatestCompatibleVersion(versions, '1.5.0')?.version).toBe(
      '1.0.0',
    );
  });

  it('does not fall back to an incompatible latest version', () => {
    expect(selectLatestCompatibleVersion(versions, '2.5.0')).toBeUndefined();
  });
});

describe('isVersionInstallable', () => {
  it('rejects unknown game versions when requested', () => {
    expect(
      isVersionInstallable('', '<=1.3.0', {
        requireKnownGameVersion: true,
        requireExplicitCompatibility: true,
      }),
    ).toBe(false);
  });

  it('rejects invalid explicit compatibility when requested', () => {
    expect(
      isVersionInstallable('1.3.0', 'definitely-not-a-range', {
        requireKnownGameVersion: true,
        requireExplicitCompatibility: true,
      }),
    ).toBe(false);
  });
});
