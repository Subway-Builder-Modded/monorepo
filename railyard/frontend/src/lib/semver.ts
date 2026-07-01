import semver from 'semver';

/**
 * Checks if a game version satisfies the required semver range.
 * Handles "v" prefixed versions (e.g. "v1.2.3") via semver.coerce.
 * Returns null if either input is missing or unparseable.
 */
export function isCompatible(
  gameVersion: string,
  requiredRange: string,
): boolean | null {
  if (!gameVersion || !requiredRange) return null;
  // coerce handles "v" prefix and loose version strings
  const coerced = semver.coerce(gameVersion);
  if (!coerced) return null;
  try {
    // satisfies also handles "v" prefixes in range comparators
    return semver.satisfies(coerced, requiredRange);
  } catch {
    return null;
  }
}

/**
 * True when candidate is a strictly newer semver than current. False when either is
 * unparseable, so an unknown version never surfaces a downgrade as an available update.
 * Mirrors the Go IsSemverNewer.
 */
export function isUpgrade(candidate: string, current: string): boolean {
  const candidateVer = semver.coerce(candidate);
  const currentVer = semver.coerce(current);
  if (!candidateVer || !currentVer) return false;
  return semver.gt(candidateVer, currentVer);
}
