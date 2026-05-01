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
    .filter((v): v is string => v !== null);

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

export type DownloadOS = RailyardDownloadOS;

export type DownloadArch = RailyardDownloadArch;

export type DetectionOS = DownloadOS | "unknown";

export type DetectionArch = DownloadArch | "unknown";

export type DetectionConfidence = "high" | "medium" | "low";

export type DetectionSource = "manual" | "user-agent-data" | "user-agent" | "fallback";

export type RailyardDetectedPlatform = {
  os: DetectionOS;
  arch: DetectionArch;
  confidence: DetectionConfidence;
  source: DetectionSource;
};

export type RailyardManualArchitectureOverride = Exclude<DownloadArch, "universal"> | null;

export type RailyardDownloadOverride = {
  os?: DownloadOS;
  arch?: Exclude<DownloadArch, "universal">;
};

export const RAILYARD_ARCH_OVERRIDE_STORAGE_KEY = "railyard.download.arch.override";

function detectOsFromPlatform(platformValue: string): DetectionOS {
  const platform = platformValue.toLowerCase();
  if (platform.includes("win")) return "windows";
  if (platform.includes("mac")) return "macos";
  if (platform.includes("linux") || platform.includes("x11")) return "linux";
  return "unknown";
}

export function normalizeRailyardArchitecture(
  architecture: string | undefined,
  bitness?: string | undefined,
): DetectionArch {
  const arch = architecture?.toLowerCase().replace(/[-\s]/g, "_") ?? "";
  const bits = bitness?.toLowerCase() ?? "";

  if (arch === "universal") {
    return "universal";
  }

  if (["arm", "arm64", "aarch64"].includes(arch)) {
    return "arm64";
  }

  if (["x86", "x64", "x86_64", "amd64"].includes(arch)) {
    return "x64";
  }

  if (bits === "64" && arch.includes("x86")) {
    return "x64";
  }

  return "unknown";
}

function hasArmSignal(architecture: string | undefined): boolean {
  const value = architecture?.toLowerCase() ?? "";
  return value.includes("arm") || value.includes("aarch64");
}

function detectArchFromNavigatorSignals(
  userAgent: string | undefined,
  platform: string | undefined,
): DetectionArch {
  const aggregate = `${userAgent ?? ""} ${platform ?? ""}`.toLowerCase();

  if (/(aarch64|arm64|armv8|\barm\b)/.test(aggregate)) {
    return "arm64";
  }

  if (/(x86_64|amd64|x64|win64|wow64|\bx86\b)/.test(aggregate)) {
    return "x64";
  }

  return "unknown";
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

  return matchedName ? (assetInfoByName[matchedName] ?? null) : null;
}

type NavigatorWithUaData = Navigator & {
  userAgentData?: {
    platform?: string;
    architecture?: string;
    bitness?: string;
    wow64?: boolean;
    getHighEntropyValues?: (hints: string[]) => Promise<{
      architecture?: string;
      bitness?: string;
      model?: string;
      platform?: string;
      platformVersion?: string;
      wow64?: boolean;
    }>;
  };
};

function resolveDetectedOs(navWithUaData: NavigatorWithUaData): {
  os: DetectionOS;
  source: Exclude<DetectionSource, "manual">;
} {
  const uaDataOs = detectOsFromPlatform(navWithUaData.userAgentData?.platform ?? "");
  if (uaDataOs !== "unknown") {
    return { os: uaDataOs, source: "user-agent-data" };
  }

  const platformOs = detectOsFromPlatform(navWithUaData.platform ?? "");
  if (platformOs !== "unknown") {
    return { os: platformOs, source: "user-agent" };
  }

  const userAgentOs = detectOsFromPlatform(navWithUaData.userAgent ?? "");
  if (userAgentOs !== "unknown") {
    return { os: userAgentOs, source: "user-agent" };
  }

  return { os: "unknown", source: "fallback" };
}

function resolveDetectionConfidence(
  os: DetectionOS,
  arch: DetectionArch,
  source: DetectionSource,
  highEntropyUsed: boolean,
): DetectionConfidence {
  if (arch === "unknown") {
    return "low";
  }

  if (source === "fallback") {
    return "low";
  }

  if (os === "windows" && arch === "x64") {
    return highEntropyUsed ? "medium" : "low";
  }

  if (source === "user-agent") {
    return arch === "arm64" ? "medium" : "low";
  }

  return highEntropyUsed ? "high" : "medium";
}

function resolveArchitectureFromEvidence(args: {
  os: DetectionOS;
  userAgent: string | undefined;
  platform: string | undefined;
  lowEntropyArchitecture: string | undefined;
  lowEntropyBitness: string | undefined;
  highEntropyArchitecture?: string | undefined;
  highEntropyBitness?: string | undefined;
  highEntropyModel?: string | undefined;
}): {
  arch: DetectionArch;
  source: Exclude<DetectionSource, "manual">;
} {
  const lowEntropyArch = normalizeRailyardArchitecture(
    args.lowEntropyArchitecture,
    args.lowEntropyBitness,
  );
  const highEntropyArch = normalizeRailyardArchitecture(
    args.highEntropyArchitecture,
    args.highEntropyBitness,
  );
  const userAgentArch = detectArchFromNavigatorSignals(args.userAgent, args.platform);

  const armEvidence =
    highEntropyArch === "arm64" ||
    lowEntropyArch === "arm64" ||
    hasArmSignal(args.highEntropyModel) ||
    hasArmSignal(args.userAgent);

  if (args.os === "windows" && armEvidence) {
    return { arch: "arm64", source: "user-agent-data" };
  }

  if (highEntropyArch !== "unknown") {
    return { arch: highEntropyArch, source: "user-agent-data" };
  }

  if (lowEntropyArch !== "unknown") {
    return { arch: lowEntropyArch, source: "user-agent-data" };
  }

  if (userAgentArch !== "unknown") {
    return { arch: userAgentArch, source: "user-agent" };
  }

  return { arch: "unknown", source: "fallback" };
}

export function detectRailyardPlatform(
  nav: Navigator | null | undefined,
): RailyardDetectedPlatform {
  if (!nav) {
    return { os: "unknown", arch: "unknown", confidence: "low", source: "fallback" };
  }

  const navWithUaData = nav as NavigatorWithUaData;
  const resolvedOs = resolveDetectedOs(navWithUaData);
  const resolvedArch = resolveArchitectureFromEvidence({
    os: resolvedOs.os,
    userAgent: navWithUaData.userAgent,
    platform: navWithUaData.platform,
    lowEntropyArchitecture: navWithUaData.userAgentData?.architecture,
    lowEntropyBitness: navWithUaData.userAgentData?.bitness,
  });

  const source: DetectionSource =
    resolvedArch.source === "fallback" ? resolvedOs.source : resolvedArch.source;

  return {
    os: resolvedOs.os,
    arch: resolvedArch.arch,
    source,
    confidence: resolveDetectionConfidence(resolvedOs.os, resolvedArch.arch, source, false),
  };
}

export function detectRailyardPlatformAccurate(
  nav: Navigator | null | undefined,
): Promise<RailyardDetectedPlatform> {
  const detected = detectRailyardPlatform(nav);
  if (!nav) {
    return Promise.resolve(detected);
  }

  const navWithUaData = nav as NavigatorWithUaData;
  const getHighEntropyValues = navWithUaData.userAgentData?.getHighEntropyValues;
  if (!getHighEntropyValues) {
    return Promise.resolve(detected);
  }

  return getHighEntropyValues([
    "architecture",
    "bitness",
    "platform",
    "platformVersion",
    "wow64",
    "model",
  ])
    .then((highEntropy) => {
      const highOs = detectOsFromPlatform(highEntropy.platform ?? "");
      const os = highOs !== "unknown" ? highOs : detected.os;

      const resolvedArch = resolveArchitectureFromEvidence({
        os,
        userAgent: navWithUaData.userAgent,
        platform: navWithUaData.platform,
        lowEntropyArchitecture: navWithUaData.userAgentData?.architecture,
        lowEntropyBitness: navWithUaData.userAgentData?.bitness,
        highEntropyArchitecture: highEntropy.architecture,
        highEntropyBitness: highEntropy.bitness,
        highEntropyModel: highEntropy.model,
      });

      const source: DetectionSource = resolvedArch.source;

      return {
        os,
        arch: resolvedArch.arch,
        source,
        confidence: resolveDetectionConfidence(os, resolvedArch.arch, source, true),
      };
    })
    .catch(() => detected);
}

export function getRailyardManualArchitectureOverride(
  storage: Pick<Storage, "getItem"> | null | undefined,
): RailyardManualArchitectureOverride {
  const value = storage?.getItem(RAILYARD_ARCH_OVERRIDE_STORAGE_KEY)?.toLowerCase() ?? null;
  if (value === "x64" || value === "arm64") {
    return value;
  }

  return null;
}

export function setRailyardManualArchitectureOverride(
  storage: Pick<Storage, "setItem" | "removeItem"> | null | undefined,
  override: RailyardManualArchitectureOverride,
): void {
  if (!storage) {
    return;
  }

  if (override === null) {
    storage.removeItem(RAILYARD_ARCH_OVERRIDE_STORAGE_KEY);
    return;
  }

  storage.setItem(RAILYARD_ARCH_OVERRIDE_STORAGE_KEY, override);
}

export function getRailyardAvailableArchitecturesForOs(
  options: RailyardDownloadOption[],
  os: DownloadOS,
): Exclude<DownloadArch, "universal">[] {
  const arches = new Set<Exclude<DownloadArch, "universal">>();
  for (const option of options) {
    if (option.os === os && option.arch !== "universal") {
      arches.add(option.arch);
    }
  }

  return Array.from(arches);
}

export function selectRecommendedRailyardDownload(
  options: RailyardDownloadOption[],
  detected: Pick<RailyardDetectedPlatform, "os" | "arch">,
  override?: RailyardDownloadOverride | null,
): RailyardDownloadOption {
  const preferredOs = override?.os ?? (detected.os !== "unknown" ? detected.os : undefined);
  const preferredArch = override?.arch ?? (detected.arch !== "unknown" ? detected.arch : undefined);

  if (preferredOs && preferredArch) {
    const exact = options.find(
      (option) => option.os === preferredOs && option.arch === preferredArch,
    );
    if (exact) {
      return exact;
    }
  }

  if (preferredOs) {
    const universal = options.find(
      (option) => option.os === preferredOs && option.arch === "universal",
    );
    if (universal) {
      return universal;
    }

    const firstForOs = options.find((option) => option.os === preferredOs);
    if (firstForOs) {
      return firstForOs;
    }
  }

  if (override?.arch) {
    const firstForArch = options.find((option) => option.arch === override.arch);
    if (firstForArch) {
      return firstForArch;
    }
  }

  return options[0]!;
}

export function getRailyardDefaultDownloadOverride(
  detected: Pick<RailyardDetectedPlatform, "os">,
  archOverride: RailyardManualArchitectureOverride,
): RailyardDownloadOverride | null {
  if (!archOverride) {
    return null;
  }

  return {
    os: detected.os !== "unknown" ? detected.os : undefined,
    arch: archOverride,
  };
}

export function shouldShowArchitectureOverride(
  options: RailyardDownloadOption[],
  detected: Pick<RailyardDetectedPlatform, "os">,
): boolean {
  if (detected.os === "unknown") {
    return false;
  }

  return getRailyardAvailableArchitecturesForOs(options, detected.os).length > 1;
}
