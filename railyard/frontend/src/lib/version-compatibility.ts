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

// describeConstraintRange turns a single-operator semver range into plain
// language, preserving boundary inclusivity (>= includes, > excludes). Compound
// or unrecognized ranges are returned unchanged. Mirrors the Go humanizeSemverRange.
export function describeConstraintRange(range: string): string {
  const r = range.trim();
  // Two-char operators first so ">=" is not matched as ">".
  const phrasings: Array<[string, (version: string) => string]> = [
    ['>=', (v) => `${v} or newer`],
    ['<=', (v) => `${v} or older`],
    ['>', (v) => `newer than ${v}`],
    ['<', (v) => `older than ${v}`],
    ['=', (v) => `exactly ${v}`],
  ];
  for (const [op, phrase] of phrasings) {
    if (r.startsWith(op)) {
      const version = r.slice(op.length).trim().replace(/^v/, '');
      if (!version || /[\s,|]/.test(version)) return range; // compound → raw
      return phrase(version);
    }
  }
  return range;
}

// describeConstraint phrases a failing constraint for the user, e.g.
// "Game version: needs 1.3.0 or newer (you have 1.2.0)". Mirrors Go DescribeConstraint.
export function describeConstraint(
  constraint: InstalledConstraint,
  gameVersion: string,
): string {
  const label =
    constraint.type === 'buildings_index' ? 'Buildings format' : 'Game version';
  return `${label}: needs ${describeConstraintRange(constraint.range)} (you have ${gameVersion})`;
}
