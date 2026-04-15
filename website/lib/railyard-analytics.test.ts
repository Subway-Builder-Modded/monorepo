import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

function writeJson(directory: string, filename: string, value: unknown) {
  writeFileSync(path.join(directory, filename), JSON.stringify(value, null, 2));
}

function writeCsv(directory: string, filename: string, rows: string[]) {
  writeFileSync(path.join(directory, filename), rows.join('\n'));
}

describe('loadRailyardAnalytics', () => {
  const dirs: string[] = [];

  afterEach(() => {
    delete process.env['RAILYARD_ANALYTICS_DIR'];
    vi.resetModules();

    for (const directory of dirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('loads and combines json + csv analytics datasets', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'railyard-analytics-'));
    dirs.push(dir);

    writeJson(dir, 'railyard_app_downloads.json', {
      schema_version: 1,
      repo: 'Subway-Builder-Modded/monorepo',
      generated_at: '2026-03-31T21:28:35.717Z',
      latest_snapshot: '2026-03-31T21:00:00.000Z',
      versions: {
        '0.2.0': {
          total_downloads: 100,
          last_1d_downloads: 30,
          last_3d_downloads: 45,
          last_7d_downloads: 90,
          assets: {
            'railyard-v0.2.0-windows-amd64-installer.exe': {
              total_downloads: 70,
              last_1d_downloads: 20,
              last_3d_downloads: 35,
              last_7d_downloads: 65,
            },
            'railyard-v0.2.0-macos-universal.dmg': {
              total_downloads: 30,
              last_1d_downloads: 10,
              last_3d_downloads: 10,
              last_7d_downloads: 25,
            },
          },
        },
        '0.1.0': {
          total_downloads: 40,
          last_1d_downloads: 2,
          last_3d_downloads: 5,
          last_7d_downloads: 8,
          assets: {
            'railyard-v0.1.0-current-linux-amd64.flatpak': {
              total_downloads: 40,
              last_1d_downloads: 2,
              last_3d_downloads: 5,
              last_7d_downloads: 8,
            },
          },
        },
      },
    });

    writeCsv(dir, 'railyard_app_by_day.csv', [
      'version,total_downloads,2026_03_30,2026_03_31',
      '0.2.0,100,80,20',
      '0.1.0,40,40,0',
    ]);

    process.env['RAILYARD_ANALYTICS_DIR'] = dir;
    const { loadRailyardAnalytics } = await import('@/lib/railyard-analytics');

    const data = loadRailyardAnalytics();

    expect(data.schemaVersion).toBe(1);
    expect(data.repo).toBe('Subway-Builder-Modded/monorepo');
    expect(data.summary.totalDownloads).toBe(140);
    expect(data.summary.totalVersions).toBe(2);
    expect(data.summary.totalAssets).toBe(3);
    expect(data.summary.current1dDownloads).toBe(32);

    expect(data.versions[0]?.version).toBe('0.2.0');
    expect(data.versions[0]?.assets[0]?.os).toBe('Windows');
    expect(data.versions[0]?.assets[0]?.packageType).toBe('EXE');

    expect(data.dailyTotals).toEqual([
      { date: '2026-03-30', downloads: 120 },
      { date: '2026-03-31', downloads: 20 },
    ]);

    expect(data.overlaps[7]).toHaveLength(7);
    const dayWithLatestSnapshot = data.overlaps[7].find(
      (row) => row.currentDate === '2026-03-31',
    );
    expect(dayWithLatestSnapshot?.currentDownloads).toBe(20);
  });

  it('returns empty-state compatible defaults when files are missing', async () => {
    const dir = mkdtempSync(
      path.join(os.tmpdir(), 'railyard-analytics-empty-'),
    );
    dirs.push(dir);

    writeJson(dir, 'railyard_app_downloads.json', {});
    writeCsv(dir, 'railyard_app_by_day.csv', []);

    process.env['RAILYARD_ANALYTICS_DIR'] = dir;
    const { loadRailyardAnalytics } = await import('@/lib/railyard-analytics');

    const data = loadRailyardAnalytics();

    expect(data.summary.totalDownloads).toBe(0);
    expect(data.versions).toEqual([]);
    expect(data.versionDaily).toEqual([]);
    expect(data.dailyTotals).toEqual([]);
    expect(data.overlaps[7]).toEqual([]);
  });
});
