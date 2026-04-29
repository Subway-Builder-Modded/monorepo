import type {
  RailyardDownloadArch,
  RailyardDownloadOption,
  RailyardDownloadOS,
} from "./railyard-types";

type GitHubReleaseAsset = {
  name?: string;
  browser_download_url?: string;
  size?: number;
};

type GitHubReleaseTagResponse = {
  assets?: GitHubReleaseAsset[];
};

export type RailyardReleaseAssetInfo = {
  downloadUrl: string;
  sizeBytes: number;
};

/**
 * Dynamically extract the latest Railyard version from available changelog files.
 * Scans the content/railyard/updates directory and returns the highest semantic version.
 */
function extractLatestRailyardVersion(): string {
  // Load all update/changelog files from the content directory
  const updateFiles = import.meta.glob(
    "../../../content/railyard/updates/*.mdx",
    { eager: true, query: "?raw", import: "default" },
  ) as Record<string, string>;

  // Extract version numbers from file paths (e.g., "...v0.2.3.mdx" → "0.2.3")
  const versions = Object.keys(updateFiles)
    .map((path) => {
      const match = path.match(/v(\d+\.\d+\.\d+)/);
      return match ? match[1] : null;
    })
    .filter((v): v is string => v !== null);

  // Sort versions in descending order (semantic versioning)
  versions.sort((a, b) => {
    const aParts = a.split(".").map(Number);
    const bParts = b.split(".").map(Number);

    for (let i = 0; i < 3; i++) {
      if (aParts[i] !== bParts[i]) {
        return bParts[i] - aParts[i];
      }
    }
    return 0;
  });

  // Return the latest version with "v" prefix, fallback to v0.1.0 if none found
  return `v${versions[0] || "0.1.0"}`;
}

export const RAILYARD_LATEST_RELEASE_VERSION = extractLatestRailyardVersion();

export const railyardDownloadOptions: RailyardDownloadOption[] = [
  {
    os: "windows",
    arch: "x64",
    label: "Windows (x64) - Installer",
    assetName: "windows-amd64-installer.exe",
  },
  {
    os: "windows",
    arch: "x64",
    label: "Windows (x64) - Portable",
    assetName: "windows-amd64-portable.zip",
  },
  {
    os: "windows",
    arch: "arm64",
    label: "Windows (ARM64) - Installer",
    assetName: "windows-arm64-installer.exe",
  },
  {
    os: "windows",
    arch: "arm64",
    label: "Windows (ARM64) - Portable",
    assetName: "windows-arm64-portable.zip",
  },
  {
    os: "macos",
    arch: "universal",
    label: "macOS (Universal) - Installer",
    assetName: "macos-universal.dmg",
  },
  {
    os: "macos",
    arch: "universal",
    label: "macOS (Universal) - Portable",
    assetName: "macos-universal.zip",
  },
  {
    os: "linux",
    arch: "x64",
    label: "Linux (x64) - Flatpak",
    assetName: "current-linux-amd64.flatpak",
  },
];

export function buildRailyardDownloadUrl(
  option: RailyardDownloadOption,
  version = RAILYARD_LATEST_RELEASE_VERSION,
): string {
  return `https://github.com/Subway-Builder-Modded/monorepo/releases/download/${version}/railyard-${version}-${option.assetName}`;
}

function detectOsFromPlatform(platformValue: string): RailyardDownloadOS | null {
  const platform = platformValue.toLowerCase();
  if (platform.includes("win")) return "windows";
  if (platform.includes("mac")) return "macos";
  if (platform.includes("linux") || platform.includes("x11")) return "linux";
  return null;
}

function normalizeArchFromUaData(
  architecture: string | undefined,
  bitness?: string | undefined,
): RailyardDownloadArch | null {
  const arch = architecture?.toLowerCase() ?? "";
  const bits = bitness?.toLowerCase() ?? "";

  if (arch === "arm" || arch === "arm64") {
    return "arm64";
  }

  if (arch === "x64" || arch === "x86_64") {
    return "x64";
  }

  if (arch === "x86" && bits === "64") {
    return "x64";
  }

  return null;
}

function hasArmSignal(architecture: string | undefined): boolean {
  const value = architecture?.toLowerCase() ?? "";
  return value.includes("arm") || value.includes("aarch64");
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function getRailyardAssetFileType(assetName: string): string {
  const dotIndex = assetName.lastIndexOf(".");
  if (dotIndex < 0 || dotIndex === assetName.length - 1) {
    return "file";
  }

  return assetName.slice(dotIndex).toLowerCase();
}

export function formatRailyardAssetSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) {
    return "Unknown size";
  }

  if (bytes >= 1_000_000) {
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
  }

  if (bytes >= 1_000) {
    return `${(bytes / 1_000).toFixed(1)} KB`;
  }

  return `${Math.round(bytes)} B`;
}

export async function fetchRailyardReleaseAssetInfo(
  version = RAILYARD_LATEST_RELEASE_VERSION,
): Promise<Record<string, RailyardReleaseAssetInfo>> {
  const encodedVersion = encodeURIComponent(version);
  const response = await fetch(
    `https://api.github.com/repos/Subway-Builder-Modded/monorepo/releases/tags/${encodedVersion}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch release assets for ${version}`);
  }

  const payload = (await response.json()) as GitHubReleaseTagResponse;
  const assets = Array.isArray(payload.assets) ? payload.assets : [];

  return assets.reduce<Record<string, RailyardReleaseAssetInfo>>((acc, asset) => {
    const name = typeof asset.name === "string" ? asset.name : null;
    const downloadUrl =
      typeof asset.browser_download_url === "string" ? asset.browser_download_url : null;
    const sizeBytes = toFiniteNumber(asset.size);

    if (!name || !downloadUrl || sizeBytes == null) {
      return acc;
    }

    acc[name] = { downloadUrl, sizeBytes };
    return acc;
  }, {});
}

export function resolveRailyardReleaseAssetInfo(
  assetInfoByName: Record<string, RailyardReleaseAssetInfo>,
  optionAssetName: string,
): RailyardReleaseAssetInfo | null {
  const exact = assetInfoByName[optionAssetName];
  if (exact) {
    return exact;
  }

  const matchedName = Object.keys(assetInfoByName).find((name) =>
    name.toLowerCase().endsWith(optionAssetName.toLowerCase()),
  );

  return matchedName ? assetInfoByName[matchedName] ?? null : null;
}

export type RailyardDetectedPlatform = {
  os: RailyardDownloadOS | null;
  arch: RailyardDownloadArch | null;
};

type NavigatorWithUaData = Navigator & {
  userAgentData?: {
    platform?: string;
    architecture?: string;
    bitness?: string;
    wow64?: boolean;
    getHighEntropyValues?: (
      hints: string[],
    ) => Promise<{
      architecture?: string;
      bitness?: string;
      model?: string;
      platform?: string;
      platformVersion?: string;
      wow64?: boolean;
    }>;
  };
};

export function detectRailyardPlatform(
  nav: Navigator | null | undefined,
): RailyardDetectedPlatform {
  if (!nav) {
    return { os: null, arch: null };
  }

  const navWithUaData = nav as NavigatorWithUaData;

  const os =
    detectOsFromPlatform(navWithUaData.userAgentData?.platform ?? "") ||
    detectOsFromPlatform(nav.platform ?? "") ||
    detectOsFromPlatform(nav.userAgent ?? "");

  const arch = normalizeArchFromUaData(
    navWithUaData.userAgentData?.architecture,
    navWithUaData.userAgentData?.bitness,
  );

  return { os, arch };
}

export async function detectRailyardPlatformAccurate(
  nav: Navigator | null | undefined,
): Promise<RailyardDetectedPlatform> {
  const detected = detectRailyardPlatform(nav);
  if (!nav) {
    return detected;
  }

  const navWithUaData = nav as NavigatorWithUaData;
  const getHighEntropyValues = navWithUaData.userAgentData?.getHighEntropyValues;
  if (!getHighEntropyValues) {
    return detected;
  }

  try {
    const highEntropy = await getHighEntropyValues([
      "architecture",
      "bitness",
      "platform",
      "wow64",
      "model",
    ]);

    const os =
      detectOsFromPlatform(highEntropy.platform ?? "") ||
      detectOsFromPlatform(navWithUaData.userAgentData?.platform ?? "") ||
      detected.os;

    const lowEntropyArchitecture = navWithUaData.userAgentData?.architecture;
    const lowEntropyBitness = navWithUaData.userAgentData?.bitness;
    const architecture = highEntropy.architecture;
    const bitness = highEntropy.bitness;
    const wow64 = Boolean(highEntropy.wow64 ?? navWithUaData.userAgentData?.wow64);
    const lowEntropyArch = normalizeArchFromUaData(lowEntropyArchitecture, lowEntropyBitness);
    const highEntropyArch = normalizeArchFromUaData(architecture, bitness);
    let arch = highEntropyArch ?? lowEntropyArch ?? detected.arch;

    if (highEntropyArch === "x64" && lowEntropyArch === "arm64") {
      arch = "arm64";
    }

    if (highEntropyArch === "x64" && hasArmSignal(highEntropy.model)) {
      arch = "arm64";
    }

    if (os === "windows" && wow64) {
      // On Windows ARM, browsers can report x86/x64 process architecture under emulation.
      arch = "arm64";
    }

    return { os, arch };
  } catch {
    return detected;
  }
}

export function selectRecommendedRailyardDownload(
  options: RailyardDownloadOption[],
  detected: RailyardDetectedPlatform,
): RailyardDownloadOption {
  const preferredOs = detected.os ?? "windows";
  const preferredArch = detected.arch ?? "x64";

  const exact = options.find(
    (option) => option.os === preferredOs && option.arch === preferredArch,
  );
  if (exact) {
    return exact;
  }

  const osDefault = options.find((option) => option.os === preferredOs && option.arch === "x64");
  if (osDefault) {
    return osDefault;
  }

  const anyForOs = options.find((option) => option.os === preferredOs);
  if (anyForOs) {
    return anyForOs;
  }

  const windowsDefault = options.find((option) => option.os === "windows" && option.arch === "x64");
  if (windowsDefault) {
    return windowsDefault;
  }

  return options[0]!;
}

export function getRailyardOptionsForOs(
  options: RailyardDownloadOption[],
  os: RailyardDownloadOS,
): RailyardDownloadOption[] {
  return options.filter((option) => option.os === os);
}
