import { describe, expect, it } from "vitest";
import {
  buildRailyardDownloadUrl,
  detectRailyardPlatform,
  detectRailyardPlatformAccurate,
  formatRailyardAssetSize,
  getRailyardAssetFileType,
  normalizeRailyardArchitecture,
  resolveRailyardReleaseAssetInfo,
  railyardDownloadOptions,
  selectRecommendedRailyardDownload,
} from "@/features/railyard/railyard-downloads";

describe("railyard downloads", () => {
  it("builds GitHub release URLs for assets", () => {
    const option = {
      os: "windows",
      arch: "x64",
      label: "Windows",
      assetName: "windows-x64.exe",
    } as const;

    expect(buildRailyardDownloadUrl(option, "v1.2.3")).toBe(
      "https://github.com/Subway-Builder-Modded/monorepo/releases/download/v1.2.3/railyard-v1.2.3-windows-x64.exe",
    );
  });

  it("selects the best exact OS and architecture match", () => {
    const recommended = selectRecommendedRailyardDownload(railyardDownloadOptions, {
      os: "windows",
      arch: "arm64",
    });

    expect(recommended.os).toBe("windows");
    expect(recommended.arch).toBe("arm64");
  });

  it("falls back safely when architecture cannot be detected", () => {
    const recommended = selectRecommendedRailyardDownload(railyardDownloadOptions, {
      os: "windows",
      arch: "unknown",
    });

    expect(recommended.os).toBe("windows");
    expect(recommended.arch).toBe("x64");
  });

  it("normalizes x64 architecture aliases", () => {
    expect(normalizeRailyardArchitecture("x86")).toBe("x64");
    expect(normalizeRailyardArchitecture("x86_64")).toBe("x64");
    expect(normalizeRailyardArchitecture("amd64")).toBe("x64");
    expect(normalizeRailyardArchitecture("x64")).toBe("x64");
  });

  it("normalizes arm64 architecture aliases", () => {
    expect(normalizeRailyardArchitecture("arm")).toBe("arm64");
    expect(normalizeRailyardArchitecture("arm64")).toBe("arm64");
    expect(normalizeRailyardArchitecture("aarch64")).toBe("arm64");
  });

  it("detects OS and architecture from navigator-like values", () => {
    const detected = detectRailyardPlatform({
      platform: "MacIntel",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/537.36 (KHTML, like Gecko)",
      userAgentData: {
        platform: "macOS",
        architecture: "arm64",
      },
    } as unknown as Navigator);

    expect(detected.os).toBe("macos");
    expect(detected.arch).toBe("arm64");
  });

  it("detects ARM64 from strong navigator signals when UA-CH arch is missing", () => {
    const detected = detectRailyardPlatform({
      platform: "Win32",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; ARM64) AppleWebKit/537.36 (KHTML, like Gecko)",
      userAgentData: {
        platform: "Windows",
      },
    } as unknown as Navigator);

    expect(detected.os).toBe("windows");
    expect(detected.arch).toBe("arm64");
  });

  it("detects Windows ARM64 when high-entropy UA data reports x86 under WoW64", async () => {
    const detected = await detectRailyardPlatformAccurate({
      platform: "Win32",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
      userAgentData: {
        platform: "Windows",
        architecture: "x86",
        wow64: true,
        getHighEntropyValues: async () => ({
          platform: "Windows",
          architecture: "x86",
          bitness: "64",
          wow64: true,
        }),
      },
    } as unknown as Navigator);

    expect(detected.os).toBe("windows");
    expect(detected.arch).toBe("arm64");
  });

  it("falls back to configured default when OS is unknown", () => {
    const recommended = selectRecommendedRailyardDownload(railyardDownloadOptions, {
      os: "unknown",
      arch: "unknown",
    });

    expect(recommended).toBe(railyardDownloadOptions[0]);
  });

  it("prefers ARM64 when UA-CH low and high entropy signals conflict", async () => {
    const detected = await detectRailyardPlatformAccurate({
      platform: "Win32",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      userAgentData: {
        platform: "Windows",
        architecture: "arm64",
        bitness: "64",
        getHighEntropyValues: async () => ({
          platform: "Windows",
          architecture: "x64",
          bitness: "64",
          wow64: false,
        }),
      },
    } as unknown as Navigator);

    expect(detected.os).toBe("windows");
    expect(detected.arch).toBe("arm64");
  });

  it("formats asset metadata for download rows", () => {
    expect(getRailyardAssetFileType("windows-arm64-portable.zip")).toBe(".zip");
    expect(formatRailyardAssetSize(13_300_000)).toBe("13.3 MB");
  });

  it("resolves release asset metadata by suffix when names include release prefixes", () => {
    const resolved = resolveRailyardReleaseAssetInfo(
      {
        "railyard-v0.2.3-windows-amd64-portable.zip": {
          downloadUrl: "https://example.test/windows.zip",
          sizeBytes: 13_300_000,
        },
      },
      "windows-amd64-portable.zip",
    );

    expect(resolved).toEqual({
      downloadUrl: "https://example.test/windows.zip",
      sizeBytes: 13_300_000,
    });
  });
});
