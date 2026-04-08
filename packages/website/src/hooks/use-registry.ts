'use client';

import { useState, useEffect } from 'react';
import { enrichAuthorIdentity } from '@/lib/authors';
import { toCumulativeDownloadTotals } from '@/lib/railyard/download-totals';
import { getRegistryAuthorDirectory } from '@/lib/railyard/registry-author-directory';
import {
  getCustomVersions,
  getGithubReleases,
} from '@/lib/railyard/github-releases';
import {
  fetchRegistryJsonWithFallback,
  getRawRegistryUrls,
  getRegistryCdnUrls,
} from '@/lib/railyard/registry-source';
import type {
  AssetDownloadCountsByVersion,
  ModManifest,
  MapManifest,
  RegistryIntegrityReport,
} from '@/types/registry';

const LAST_UPDATED_WORKER_LIMIT = 6;

type LastUpdatedCandidate = {
  version: string;
  date: string;
  prerelease: boolean;
};

type LastUpdatedArgs = {
  id: string;
  updateType?: string;
  source?: string;
};

const lastUpdatedCache = new Map<string, number>();

async function fetchIndex(type: 'mods' | 'maps'): Promise<string[]> {
  const data = await fetchRegistryJsonWithFallback<Record<string, unknown>>(
    `${type}/index.json`,
  );
  return Array.isArray(data[type]) ? (data[type] as string[]) : [];
}

async function fetchManifest<T>(type: 'mods' | 'maps', id: string): Promise<T> {
  return fetchRegistryJsonWithFallback<T>(`${type}/${id}/manifest.json`);
}

async function fetchIntegrity(
  type: 'mods' | 'maps',
): Promise<RegistryIntegrityReport> {
  return fetchRegistryJsonWithFallback<RegistryIntegrityReport>(
    `${type}/integrity.json`,
  );
}

async function fetchDownloadCounts(
  type: 'mods' | 'maps',
): Promise<AssetDownloadCountsByVersion> {
  return fetchRegistryJsonWithFallback<AssetDownloadCountsByVersion>(
    `${type}/downloads.json`,
  );
}

function parseVersionDate(value: string, updateType: string): number | null {
  if (!value) return null;

  if (updateType === 'github') {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : null;
  }

  if (updateType === 'custom') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const year = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const day = Number.parseInt(match[3], 10);
    const timestamp = Date.UTC(year, month - 1, day);
    return Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : null;
  }

  return null;
}

function determineLatestTimestamp(
  candidates: LastUpdatedCandidate[],
  updateType: string,
): number {
  let bestStable = Number.NEGATIVE_INFINITY;
  let bestAny = Number.NEGATIVE_INFINITY;

  for (const candidate of candidates) {
    const timestamp = parseVersionDate(candidate.date, updateType);
    if (timestamp === null) continue;

    if (timestamp > bestAny) bestAny = timestamp;
    if (!candidate.prerelease && timestamp > bestStable) {
      bestStable = timestamp;
    }
  }

  if (Number.isFinite(bestStable)) return bestStable;
  if (Number.isFinite(bestAny)) return bestAny;
  return 0;
}

function isValidSemverVersion(version: string): boolean {
  const trimmed = version.trim();
  if (!trimmed) return false;
  if (trimmed.includes('-') || trimmed.includes('+')) return false;

  const normalized = trimmed.startsWith('v') ? trimmed : `v${trimmed}`;
  return /^v\d+\.\d+\.\d+$/.test(normalized);
}

async function fetchGitHubLastUpdatedCandidates(
  repo: string,
): Promise<LastUpdatedCandidate[]> {
  const releases = await getGithubReleases(repo);

  return releases
    .map((release) => ({
      version: release.tag_name ?? '',
      date: release.published_at ?? '',
      prerelease: Boolean(release.prerelease),
    }))
    .filter((candidate) => isValidSemverVersion(candidate.version));
}

async function fetchCustomLastUpdatedCandidates(
  url: string,
): Promise<LastUpdatedCandidate[]> {
  const versions = await getCustomVersions(url);

  return versions
    .map((entry) => ({
      version: entry.version,
      date: entry.date,
      prerelease: Boolean(entry.prerelease),
    }))
    .filter((candidate) => isValidSemverVersion(candidate.version));
}

async function resolveLastUpdatedForSource(
  args: LastUpdatedArgs,
): Promise<number> {
  const updateType = args.updateType;
  const source = args.source;
  if (!updateType || !source) return 0;

  const cacheKey = `${updateType}|${source}`;
  if (lastUpdatedCache.has(cacheKey)) {
    return lastUpdatedCache.get(cacheKey) ?? 0;
  }

  try {
    const candidates =
      updateType === 'github'
        ? await fetchGitHubLastUpdatedCandidates(source)
        : updateType === 'custom'
          ? await fetchCustomLastUpdatedCandidates(source)
          : [];

    const timestamp = determineLatestTimestamp(candidates, updateType);
    lastUpdatedCache.set(cacheKey, timestamp);
    return timestamp;
  } catch {
    lastUpdatedCache.set(cacheKey, 0);
    return 0;
  }
}

async function resolveLastUpdatedBatch(
  manifests: Array<ModManifest | MapManifest>,
): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  const queue: LastUpdatedArgs[] = manifests.map((manifest) => ({
    id: manifest.id,
    updateType: manifest.update?.type,
    source:
      manifest.update?.type === 'github'
        ? manifest.update.repo
        : manifest.update?.url,
  }));

  const workerCount = Math.min(
    LAST_UPDATED_WORKER_LIMIT,
    Math.max(1, queue.length),
  );

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (queue.length > 0) {
        const next = queue.pop();
        if (!next) return;
        results[next.id] = await resolveLastUpdatedForSource(next);
      }
    }),
  );

  return results;
}

interface RegistryState {
  mods: ModManifest[];
  maps: MapManifest[];
  modIntegrity: RegistryIntegrityReport | null;
  mapIntegrity: RegistryIntegrityReport | null;
  modDownloadTotals: Record<string, number>;
  mapDownloadTotals: Record<string, number>;
  loading: boolean;
  error: string | null;
}

export function useRegistry(): RegistryState {
  const [mods, setMods] = useState<ModManifest[]>([]);
  const [maps, setMaps] = useState<MapManifest[]>([]);
  const [modIntegrity, setModIntegrity] =
    useState<RegistryIntegrityReport | null>(null);
  const [mapIntegrity, setMapIntegrity] =
    useState<RegistryIntegrityReport | null>(null);
  const [modDownloadTotals, setModDownloadTotals] = useState<
    Record<string, number>
  >({});
  const [mapDownloadTotals, setMapDownloadTotals] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [
          modIds,
          mapIds,
          modsIntegrity,
          mapsIntegrity,
          modCounts,
          mapCounts,
          authorDirectory,
        ] = await Promise.all([
          fetchIndex('mods'),
          fetchIndex('maps'),
          fetchIntegrity('mods'),
          fetchIntegrity('maps'),
          fetchDownloadCounts('mods').catch(() => ({})),
          fetchDownloadCounts('maps').catch(() => ({})),
          getRegistryAuthorDirectory(),
        ]);

        const [fetchedMods, fetchedMaps] = await Promise.all([
          Promise.all(
            modIds.map((id) => fetchManifest<ModManifest>('mods', id)),
          ),
          Promise.all(
            mapIds.map((id) => fetchManifest<MapManifest>('maps', id)),
          ),
        ]);

        const enrichedMods = fetchedMods.map((manifest) =>
          enrichAuthorIdentity(manifest, authorDirectory),
        );
        const enrichedMaps = fetchedMaps.map((manifest) =>
          enrichAuthorIdentity(manifest, authorDirectory),
        );

        const liveMods = enrichedMods.filter((m) => !m.is_test);
        const liveMaps = enrichedMaps.filter((m) => !m.is_test);

        const [modLastUpdated, mapLastUpdated] = await Promise.all([
          resolveLastUpdatedBatch(liveMods),
          resolveLastUpdatedBatch(liveMaps),
        ]);

        const modsWithLastUpdated = liveMods.map((manifest) => ({
          ...manifest,
          last_updated: modLastUpdated[manifest.id] ?? 0,
        }));

        const mapsWithLastUpdated = liveMaps.map((manifest) => ({
          ...manifest,
          last_updated: mapLastUpdated[manifest.id] ?? 0,
        }));

        const filteredMods = modsWithLastUpdated.filter(
          (manifest) =>
            modsIntegrity.listings?.[manifest.id]?.has_complete_version,
        );
        const filteredMaps = mapsWithLastUpdated.filter(
          (manifest) =>
            mapsIntegrity.listings?.[manifest.id]?.has_complete_version,
        );

        if (!cancelled) {
          setMods(filteredMods);
          setMaps(filteredMaps);
          setModIntegrity(modsIntegrity);
          setMapIntegrity(mapsIntegrity);
          setModDownloadTotals(toCumulativeDownloadTotals(modCounts));
          setMapDownloadTotals(toCumulativeDownloadTotals(mapCounts));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load registry',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    mods,
    maps,
    modIntegrity,
    mapIntegrity,
    modDownloadTotals,
    mapDownloadTotals,
    loading,
    error,
  };
}

export function buildGalleryUrl(
  type: 'mods' | 'maps',
  id: string,
  imagePath: string,
): string {
  return getRawRegistryUrls(`${type}/${id}/${imagePath}`)[0];
}

export function buildGalleryCdnUrl(
  type: 'mods' | 'maps',
  id: string,
  imagePath: string,
): string {
  return getRegistryCdnUrls(`${type}/${id}/${imagePath}`)[0];
}
