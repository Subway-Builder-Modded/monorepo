import { isCompatible } from '@/lib/semver';

interface GameCompatibleVersion {
  game_version: string;
}

interface CompatibilityOptions {
  requireKnownGameVersion?: boolean;
  requireExplicitCompatibility?: boolean;
}

export function isVersionInstallable(
  gameVersion: string,
  requiredRange: string,
  options: CompatibilityOptions = {},
): boolean {
  const {
    requireKnownGameVersion = false,
    requireExplicitCompatibility = false,
  } = options;

  if (!gameVersion) {
    return !requireKnownGameVersion;
  }

  const compatibility = isCompatible(gameVersion, requiredRange);
  return requireExplicitCompatibility
    ? compatibility === true
    : compatibility !== false;
}

export function selectLatestCompatibleVersion<T extends GameCompatibleVersion>(
  versions: T[],
  gameVersion: string,
  options?: CompatibilityOptions,
): T | undefined {
  const latestVersion = versions[0];
  if (!latestVersion) return undefined;
  if (!gameVersion) {
    return isVersionInstallable(
      gameVersion,
      latestVersion.game_version,
      options,
    )
      ? latestVersion
      : undefined;
  }

  return versions.find((version) =>
    isVersionInstallable(gameVersion, version.game_version, options),
  );
}
