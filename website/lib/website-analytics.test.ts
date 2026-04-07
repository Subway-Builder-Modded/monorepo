import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

function writeJson(directory: string, filename: string, value: unknown) {
  writeFileSync(path.join(directory, filename), JSON.stringify(value, null, 2));
}

describe('loadWebsiteAnalytics', () => {
  const dirs: string[] = [];

  afterEach(() => {
    delete process.env['WEBSITE_ANALYTICS_DIR'];
    vi.resetModules();
    for (const directory of dirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('loads datasets and merges trailing slash page variants', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'website-analytics-'));
    dirs.push(dir);

    writeJson(dir, 'snapshot-meta.json', {
      snapshotLabel: '2026-03-31 00:00 UTC',
    });
    writeJson(dir, 'summary.json', {
      pageviews: 99,
      visitors: 42,
      topPage: '/docs',
      topPageViews: 20,
      topCountry: 'United States',
      topCountryVisitors: 13,
      topDevice: 'Desktop',
      topDeviceVisitors: 15,
    });
    writeJson(dir, 'timeseries.json', [
      { date: '2026-03-30', pageviews: 12, visitors: 6 },
      { date: '2026-03-31', pageviews: 14, visitors: 8 },
    ]);
    writeJson(dir, 'pages.json', [
      {
        path: '/registry',
        pageviews: { '1d': 10, '7d': 20, '30d': 30, all: 40 },
        visitors: { '1d': 2, '7d': 4, '30d': 6, all: 8 },
        entrances: { '1d': 1, '7d': 2, '30d': 3, all: 4 },
      },
      {
        path: '/registry/',
        pageviews: { '1d': 3, '7d': 5, '30d': 7, all: 9 },
        visitors: { '1d': 1, '7d': 1, '30d': 2, all: 3 },
        entrances: { '1d': 1, '7d': 1, '30d': 1, all: 1 },
      },
    ]);
    writeJson(dir, 'countries.json', [
      {
        country: 'United States',
        pageviews: { '1d': 4, '7d': 9, '30d': 15, all: 20 },
        visitors: { '1d': 2, '7d': 5, '30d': 8, all: 11 },
      },
    ]);
    writeJson(dir, 'devices.json', [{ device: 'Desktop', visitors: 19 }]);

    process.env['WEBSITE_ANALYTICS_DIR'] = dir;
    const { loadWebsiteAnalytics } = await import('@/lib/website-analytics');

    const data = loadWebsiteAnalytics();

    expect(data.snapshotLabel).toBe('2026-03-31 00:00 UTC');
    expect(data.pages).toHaveLength(1);
    expect(data.pages[0]?.path).toBe('/registry');
    expect(data.pages[0]?.pageviews.all).toBe(49);
    expect(data.pages[0]?.visitors.all).toBe(11);
    expect(data.pages[0]?.entrances?.all).toBe(5);
  });

  it('returns empty-state compatible defaults when optional files are missing', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'website-analytics-empty-'));
    dirs.push(dir);
    writeJson(dir, 'summary.json', {});

    process.env['WEBSITE_ANALYTICS_DIR'] = dir;
    const { loadWebsiteAnalytics } = await import('@/lib/website-analytics');

    const data = loadWebsiteAnalytics();

    expect(data.summary.pageviews).toBe(0);
    expect(data.summary.visitors).toBe(0);
    expect(data.timeseries).toEqual([]);
    expect(data.pages).toEqual([]);
    expect(data.snapshotLabel).toMatch(/UTC$/);
  });
});
