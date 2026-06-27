import { isCompatible } from '@/lib/semver';

interface GameCompatibleVersion {
  game_version: string;
  map_buildings_constraint?: string;
}

export function selectLatestCompatibleVersion<T extends GameCompatibleVersion>(
  versions: T[],
  gameVersion: string,
): T | undefined {
  const latestVersion = versions[0];
  if (!latestVersion || !gameVersion) return latestVersion;

  return versions.find((version) => {
    if (isCompatible(gameVersion, version.game_version) === false) return false;
    if (
      version.map_buildings_constraint &&
      isCompatible(gameVersion, version.map_buildings_constraint) === false
    )
      return false;
    return true;
  });
}

export interface InstalledConstraint {
  type: string;
  range: string;
}

/**
 * Returns false if any constraint is violated, null when compatibility
 * cannot be determined (no game version detected, or no constraints stored).
 */
export function isInstalledCompatible(
  gameVersion: string,
  constraints: InstalledConstraint[],
): boolean | null {
  if (!gameVersion) return null;
  if (!constraints?.length) return null;
  for (const c of constraints) {
    if (isCompatible(gameVersion, c.range) === false) return false;
  }
  return true;
}

/**
 * Returns the subset of constraints that fail for the given game version,
 * sorted so buildings_index (more specific) comes before manifest.
 */
export function getFailingConstraints(
  gameVersion: string,
  constraints: InstalledConstraint[],
): InstalledConstraint[] {
  if (!gameVersion || !constraints?.length) return [];
  const failing = constraints.filter(
    (c) => isCompatible(gameVersion, c.range) === false,
  );
  return failing.sort((a) => (a.type === 'buildings_index' ? -1 : 1));
}
