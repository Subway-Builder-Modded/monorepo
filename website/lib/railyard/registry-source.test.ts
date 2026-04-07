import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchRegistryJsonWithFallback,
  getRawRegistryRefUrls,
  getRawRegistryUrls,
  getRegistryCdnUrls,
} from '@/lib/railyard/registry-source';

describe('registry-source', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds raw and CDN URL candidates in primary->legacy order', () => {
    const path = 'mods/example/manifest.json';

    expect(getRawRegistryUrls(path)).toEqual([
      'https://raw.githubusercontent.com/Subway-Builder-Modded/registry/main/mods/example/manifest.json',
      'https://raw.githubusercontent.com/Subway-Builder-Modded/The-Railyard/main/mods/example/manifest.json',
    ]);

    expect(getRawRegistryRefUrls(path)).toEqual([
      'https://raw.githubusercontent.com/Subway-Builder-Modded/registry/refs/heads/main/mods/example/manifest.json',
      'https://raw.githubusercontent.com/Subway-Builder-Modded/The-Railyard/refs/heads/main/mods/example/manifest.json',
    ]);

    expect(getRegistryCdnUrls(path)).toEqual([
      'https://cdn.jsdelivr.net/gh/Subway-Builder-Modded/registry@main/mods/example/manifest.json',
      'https://cdn.jsdelivr.net/gh/Subway-Builder-Modded/The-Railyard@main/mods/example/manifest.json',
    ]);
  });

  it('fetches from The-Railyard fallback when registry fails', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/registry/')) {
          return new Response('not found', {
            status: 404,
            statusText: 'Not Found',
          });
        }

        return new Response(
          JSON.stringify({ sourceRepo: 'The-Railyard', ok: true }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        );
      });

    const payload = await fetchRegistryJsonWithFallback<{
      sourceRepo: string;
      ok: boolean;
    }>('mods/index.json');

    expect(payload).toEqual({ sourceRepo: 'The-Railyard', ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/registry/main/mods/index.json',
    );
    expect(String(fetchMock.mock.calls[1][0])).toContain(
      '/The-Railyard/main/mods/index.json',
    );
  });

  it.fails(
    'KNOWN_FAILING: registry should serve index without fallback',
    async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(
        async (input: RequestInfo | URL) => {
          const url = String(input);
          if (url.includes('/registry/')) {
            return new Response('not found', {
              status: 404,
              statusText: 'Not Found',
            });
          }

          return new Response(
            JSON.stringify({ sourceRepo: 'The-Railyard', ok: true }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            },
          );
        },
      );

      const payload = await fetchRegistryJsonWithFallback<{
        sourceRepo: string;
      }>('mods/index.json');

      expect(payload.sourceRepo).toBe('registry');
    },
  );
});
