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

// Shared base sentence for every game-version incompatibility surface.
export const INCOMPATIBLE_GAME_VERSION_MESSAGE =
  'Not compatible with your game version';

function constraintLabel(type: string): string {
  return type === 'buildings_index' ? 'Buildings format' : 'Game version';
}

// constraintsFromVersion builds the compatibility constraints a registry version
// imposes: its game-version range, plus (for maps) its buildings-index range.
// Mirrors the Go ConstraintsFromVersionInfo.
export function constraintsFromVersion(
  version: GameCompatibleVersion,
): InstalledConstraint[] {
  const constraints: InstalledConstraint[] = [];
  if (version.game_version) {
    constraints.push({ type: 'manifest', range: version.game_version });
  }
  if (version.map_buildings_constraint) {
    constraints.push({
      type: 'buildings_index',
      range: version.map_buildings_constraint,
    });
  }
  return constraints;
}

// describeConstraintRequirement phrases what a constraint needs, without the
// user's current version, e.g. "Game version: needs 1.3.0 or newer". Use where
// the game version is already shown elsewhere (e.g. a dialog header).
export function describeConstraintRequirement(
  constraint: InstalledConstraint,
): string {
  return `${constraintLabel(constraint.type)}: needs ${describeConstraintRange(constraint.range)}`;
}

// describeConstraint adds the user's current version, e.g.
// "Game version: needs 1.3.0 or newer (you have 1.2.0)". Mirrors Go DescribeConstraint.
export function describeConstraint(
  constraint: InstalledConstraint,
  gameVersion: string,
): string {
  return `${describeConstraintRequirement(constraint)} (you have ${gameVersion})`;
}

// describeIncompatibility builds the full unified message for a version's failing
// constraints, e.g. "Not compatible with your game version. Game version: needs
// 1.3.0 or newer (you have 1.2.0)". Empty when fully compatible.
export function describeIncompatibility(
  gameVersion: string,
  constraints: InstalledConstraint[],
): string {
  const failing = getFailingConstraints(gameVersion, constraints);
  if (failing.length === 0) return '';
  const reasons = failing
    .map((c) => describeConstraint(c, gameVersion))
    .join('; ');
  return `${INCOMPATIBLE_GAME_VERSION_MESSAGE}. ${reasons}`;
}
