const ASSET_LABEL_PATTERNS: Array<{ regex: RegExp; label: string }> = [
  {
    regex: /^railyard-v\d+\.\d+\.\d+-windows-amd64-installer\.exe$/i,
    label: 'Windows (x64) - Installer',
  },
  {
    regex: /^railyard-v\d+\.\d+\.\d+-windows-amd64-portable\.zip$/i,
    label: 'Windows (x64) - Portable',
  },
  {
    regex: /^railyard-v\d+\.\d+\.\d+-windows-arm64-installer\.exe$/i,
    label: 'Windows (ARM64) - Installer',
  },
  {
    regex: /^railyard-v\d+\.\d+\.\d+-windows-arm64-portable\.zip$/i,
    label: 'Windows (ARM64) - Portable',
  },
  {
    regex: /^railyard-v\d+\.\d+\.\d+-macos-universal\.dmg$/i,
    label: 'macOS - Universal',
  },
  {
    regex: /^railyard-v\d+\.\d+\.\d+-macos-universal\.zip$/i,
    label: 'macOS (ZIP) - Universal',
  },
  {
    regex: /^railyard-v\d+\.\d+\.\d+-current-linux-amd64\.flatpak$/i,
    label: 'Linux (x64) - Flatpak',
  },
  {
    regex: /^railyard-v\d+\.\d+\.\d+-linux-amd64\.flatpak$/i,
    label: 'Linux (x64) - Flatpak',
  },
  {
    regex: /^railyard-v\d+\.\d+\.\d+-current-linux-amd64\.appimage$/i,
    label: 'Linux (x64) - AppImage',
  },
  {
    regex:
      /^railyard-v\d+\.\d+\.\d+-(?:current-|legacy-)?linux-amd64\.appimage$/i,
    label: 'Linux (x64) - AppImage',
  },
];

export function getRailyardAssetLabel(assetName: string): string {
  const normalized = String(assetName ?? '').trim();
  for (const pattern of ASSET_LABEL_PATTERNS) {
    if (pattern.regex.test(normalized)) {
      return pattern.label;
    }
  }

  return normalized;
}
