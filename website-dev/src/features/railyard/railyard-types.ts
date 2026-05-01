export type RailyardRegistrySummary = {
  mapsCount: number;
  modsCount: number;
};

export type RailyardDownloadOS = "windows" | "macos" | "linux";

export type RailyardDownloadArch = "x64" | "arm64" | "universal";

export type RailyardDownloadOption = {
  os: RailyardDownloadOS;
  arch: RailyardDownloadArch;
  label: string;
  assetName: string;
};

export type RailyardStoryStep = {
  id: string;
  icon: string;
  title: string;
  description: string;
  imageLight: string;
  imageDark: string;
  imageAlt: string;
};

export type RailyardBridgeCard = {
  id: string;
  title: string;
  description: string;
  href: string;
};
