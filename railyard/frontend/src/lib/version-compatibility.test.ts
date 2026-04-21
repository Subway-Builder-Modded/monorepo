import { describe, expect, it } from 'vitest';

import { selectLatestCompatibleVersion } from './version-compatibility';

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
});
