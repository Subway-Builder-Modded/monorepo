export interface VersionWithDownloadCount {
  version: string;
  downloads: number;
}

export function withZeroDownloads<T extends VersionWithDownloadCount>(
  versions: T[],
): T[] {
  return versions.map((version) => ({ ...version, downloads: 0 }));
}

export function mergeVersionDownloads<T extends VersionWithDownloadCount>(
  versions: T[],
  counts: Record<string, number>,
  warningContext: string,
): T[] {
  const countsByVersion = counts ?? {};
  const knownVersions = new Set(versions.map((version) => version.version));

  const merged = versions.map((version) => {
    if (!(version.version in countsByVersion)) {
      console.warn(
        `[${warningContext}] Missing download count for version "${version.version}"`,
      );
    }

    return {
      ...version,
      downloads: countsByVersion[version.version] ?? 0,
    };
  });

  for (const version of Object.keys(countsByVersion)) {
    if (!knownVersions.has(version)) {
      console.warn(
        `[${warningContext}] Download counts contain unknown version "${version}"`,
      );
    }
  }

  return merged;
}
