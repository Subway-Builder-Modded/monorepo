import type { AssetType } from '@subway-builder-modded/config';

import { isCompatible, isUpgrade } from '@/lib/semver';

interface GameCompatibleVersion {
  game_version: string;
  map_buildings_constraint?: string;
}

// getDownloadableVersions keeps the versions actually installable for an asset type: mods
// require a manifest asset, maps have no such gate. Mirrors the backend's installable filter.
export function getDownloadableVersions<T extends { manifest?: string }>(
  assetType: AssetType,
  versions: T[],
): T[] {
  return assetType === 'mod'
    ? versions.filter((version) => version.manifest)
    : versions;
}

/**
 * Decides whether an installed asset has an available update, from the backend's
 * pending resolution. That resolution is the single source of truth: it filters to
 * game-compatible versions and returns nothing when the game version is undetected.
 * We surface it only when strictly newer than what is installed — defense-in-depth,
 * since the backend already guarantees that. Never falls back to a locally-computed
 * "latest version", which would resurface updates the backend deliberately suppressed
 * (phantom updates when undetected) or point at an older version (a downgrade).
 */
export function resolveAvailableUpdate(
  installedVersion: string | null | undefined,
  pendingLatestVersion: string | null,
): { targetVersion?: string; hasUpdate: boolean } {
  if (!installedVersion || !pendingLatestVersion) {
    return { hasUpdate: false };
  }
  const hasUpdate = isUpgrade(pendingLatestVersion, installedVersion);
  return {
    targetVersion: hasUpdate ? pendingLatestVersion : undefined,
    hasUpdate,
  };
}

// isVersionGameCompatible reports whether the game version satisfies every constraint a
// version imposes (its manifest game_version and, for maps, its buildings-index range).
// The single compatibility predicate, shared by selection and per-version checks.
export function isVersionGameCompatible(
  version: GameCompatibleVersion,
  gameVersion: string,
): boolean {
  return (
    getFailingConstraints(gameVersion, constraintsFromVersion(version))
      .length === 0
  );
}

export function selectLatestCompatibleVersion<T extends GameCompatibleVersion>(
  versions: T[],
  gameVersion: string,
): T | undefined {
  const latestVersion = versions[0];
  if (!latestVersion || !gameVersion) return latestVersion;

  return versions.find((version) =>
    isVersionGameCompatible(version, gameVersion),
  );
}

export interface InstalledConstraint {
  type: string;
  range: string;
}

/** False if any constraint is violated; null when undeterminable (no game version, or none stored). */
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

/** The constraints that fail for the game version, buildings_index first. */
export function getFailingConstraints(
  gameVersion: string,
  constraints: InstalledConstraint[],
): InstalledConstraint[] {
  if (!gameVersion || !constraints?.length) return [];
  const failing = constraints.filter(
    (c) => isCompatible(gameVersion, c.range) === false,
  );
  // buildings_index is the more specific format requirement, so surface it first.
  return failing.sort((a) => (a.type === 'buildings_index' ? -1 : 1));
}

// describeConstraintRange turns a single-operator semver range into plain language. Mirrors Go humanizeSemverRange.
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

export function constraintLabel(type: string): string {
  return type === 'buildings_index' ? 'Buildings format' : 'Game version';
}

// constraintsFromVersion builds the constraints a version imposes. Mirrors Go ConstraintsFromVersionInfo.
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

// describeConstraintRequirement phrases a constraint's requirement, e.g. "Game version: needs 1.3.0 or newer".
// Use where the game version is already shown elsewhere (e.g. a dialog header).
export function describeConstraintRequirement(
  constraint: InstalledConstraint,
): string {
  return `${constraintLabel(constraint.type)}: needs ${describeConstraintRange(constraint.range)}`;
}

// describeConstraint adds the user's version, e.g. "… needs 1.3.0 or newer (you have 1.2.0)". Mirrors Go DescribeConstraint.
export function describeConstraint(
  constraint: InstalledConstraint,
  gameVersion: string,
): string {
  return `${describeConstraintRequirement(constraint)} (you have ${gameVersion})`;
}

// describeIncompatibility builds the full incompatibility message, or "" when compatible. Mirrors Go DescribeIncompatibility.
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
