import type { RailyardDownloadOption } from "./railyard-types";

function extractLatestRailyardVersion(): string {
  const updateFiles = import.meta.glob("../../../content/railyard/updates/*.mdx", {
    eager: true,
    query: "?raw",
    import: "default",
  }) as Record<string, string>;

  const versions = Object.keys(updateFiles)
    .map((path) => {
      const match = path.match(/v(\d+\.\d+\.\d+)/);
      return match ? match[1] : null;
    })
    .filter((version): version is string => version !== null);

  versions.sort((a, b) => {
    const aParts = a.split(".").map(Number);
    const bParts = b.split(".").map(Number);

    for (let i = 0; i < 3; i += 1) {
      if (aParts[i] !== bParts[i]) {
        return bParts[i] - aParts[i];
      }
    }

    return 0;
  });

  return `v${versions[0] || "0.1.0"}`;
}

export const RAILYARD_LATEST_RELEASE_VERSION = extractLatestRailyardVersion();

export function buildRailyardDownloadUrl(
  option: RailyardDownloadOption,
  version = RAILYARD_LATEST_RELEASE_VERSION,
): string {
  return `https://github.com/Subway-Builder-Modded/monorepo/releases/download/${version}/railyard-${version}-${option.assetName}`;
}
