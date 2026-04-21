import { isCompatible } from '@/lib/semver';

interface GameCompatibleVersion {
  game_version: string;
}

export function selectLatestCompatibleVersion<T extends GameCompatibleVersion>(
  versions: T[],
  gameVersion: string,
): T | undefined {
  const latestVersion = versions[0];
  if (!latestVersion || !gameVersion) return latestVersion;

  return versions.find(
    (version) => isCompatible(gameVersion, version.game_version) !== false,
  );
}
