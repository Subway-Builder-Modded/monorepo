import { describe, expect, it } from 'vitest';
import { getRailyardAssetLabel } from '@/lib/railyard-asset-label';

describe('getRailyardAssetLabel', () => {
  it('maps known asset names to user-friendly labels', () => {
    expect(
      getRailyardAssetLabel('railyard-v0.2.0-windows-amd64-installer.exe'),
    ).toBe('Windows (x64) - Installer');
    expect(
      getRailyardAssetLabel('railyard-v0.2.0-windows-amd64-portable.zip'),
    ).toBe('Windows (x64) - Portable');
    expect(
      getRailyardAssetLabel('railyard-v0.2.0-windows-arm64-installer.exe'),
    ).toBe('Windows (ARM64) - Installer');
    expect(
      getRailyardAssetLabel('railyard-v0.2.0-windows-arm64-portable.zip'),
    ).toBe('Windows (ARM64) - Portable');
    expect(getRailyardAssetLabel('railyard-v0.2.0-macos-universal.dmg')).toBe(
      'macOS - Universal',
    );
    expect(getRailyardAssetLabel('railyard-v0.2.0-macos-universal.zip')).toBe(
      'macOS (ZIP) - Universal',
    );
    expect(
      getRailyardAssetLabel('railyard-v0.2.0-current-linux-amd64.flatpak'),
    ).toBe('Linux (x64) - Flatpak');
    expect(
      getRailyardAssetLabel('railyard-v0.2.0-current-linux-amd64.AppImage'),
    ).toBe('Linux (x64) - AppImage');
    expect(getRailyardAssetLabel('railyard-v0.1.3-linux-amd64.AppImage')).toBe(
      'Linux (x64) - AppImage',
    );
    expect(
      getRailyardAssetLabel('railyard-v0.1.3-legacy-linux-amd64.AppImage'),
    ).toBe('Linux (x64) - AppImage');
  });

  it('returns original name when no alias rule matches', () => {
    expect(getRailyardAssetLabel('unknown-file.bin')).toBe('unknown-file.bin');
  });
});
