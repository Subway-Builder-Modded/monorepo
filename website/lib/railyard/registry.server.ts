import type { Metadata } from 'next';
import { enrichAuthorIdentity } from '@/lib/authors';
import { getRegistryAuthorDirectory } from '@/lib/railyard/registry-author-directory';
import { buildEmbedMetadata } from '@/config/site/metadata';
import {
  fetchRegistryJsonWithFallback,
  getRawRegistryUrls,
} from '@/lib/railyard/registry-source';
import type {
  MapManifest,
  ModManifest,
  RegistryIntegrityReport,
} from '@/types/registry';

export type RailyardRegistryType = 'mods' | 'maps';

type RailyardManifest = ModManifest | MapManifest;
const RAILYARD_EMBED_FALLBACK_IMAGE_PATH =
  '/images/docs/creating-custom-maps/empty-thumbnail.png?v=20260329';
const EMBED_DESCRIPTION_MAX_LENGTH = 180;

async function fetchRegistryJson<T>(path: string): Promise<T | null> {
  try {
    return await fetchRegistryJsonWithFallback<T>(path);
  } catch {
    return null;
  }
}

function truncateDescription(
  value: string,
  maxLength = EMBED_DESCRIPTION_MAX_LENGTH,
) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;

  const sliced = normalized.slice(0, maxLength).trimEnd();
  const boundary = sliced.lastIndexOf(' ');
  const body =
    boundary > Math.floor(maxLength * 0.6) ? sliced.slice(0, boundary) : sliced;
  return `${body}...`;
}

function encodePathSegment(value: string): string {
  return encodeURIComponent(value);
}

function encodePath(value: string): string {
  return value.split('/').filter(Boolean).map(encodePathSegment).join('/');
}

function resolveManifestName(
  manifest: RailyardManifest,
  fallbackId: string,
): string {
  const name = typeof manifest.name === 'string' ? manifest.name.trim() : '';
  return name.length > 0 ? name : fallbackId;
}

function resolveManifestDescription(
  manifest: RailyardManifest,
  fallbackName: string,
): string {
  const description =
    typeof manifest.description === 'string' ? manifest.description.trim() : '';
  return truncateDescription(
    description.length > 0 ? description : `View ${fallbackName} on Railyard.`,
  );
}

function resolveManifestEmbedImage(
  type: RailyardRegistryType,
  id: string,
  manifest: RailyardManifest,
): string {
  const thumbnailPath = manifest.gallery?.find(
    (entry): entry is string =>
      typeof entry === 'string' && entry.trim().length > 0,
  );
  if (!thumbnailPath) return RAILYARD_EMBED_FALLBACK_IMAGE_PATH;

  return getRawRegistryUrls(
    `${encodePathSegment(type)}/${encodePathSegment(id)}/${encodePath(thumbnailPath)}`,
  )[0];
}

export async function getRegistryStaticIds(
  type: RailyardRegistryType,
): Promise<string[]> {
  const data = await fetchRegistryJson<Record<RailyardRegistryType, string[]>>(
    `${type}/index.json`,
  );
  const ids = data?.[type];
  return Array.isArray(ids) ? ids : [];
}

export async function getRegistryStaticVersionParams(
  type: RailyardRegistryType,
): Promise<{ id: string; version: string }[]> {
  const integrity = await fetchRegistryJson<RegistryIntegrityReport>(
    `${type}/integrity.json`,
  );
  const listings = integrity?.listings ?? {};

  return Object.entries(listings).flatMap(([id, entry]) =>
    (entry.complete_versions ?? []).map((version) => ({ id, version })),
  );
}

export async function getRegistryManifest(
  type: RailyardRegistryType,
  id: string,
): Promise<RailyardManifest | null> {
  const manifest = await fetchRegistryJson<RailyardManifest>(
    `${type}/${encodePathSegment(id)}/manifest.json`,
  );
  if (!manifest) return null;

  const authorDirectory = await getRegistryAuthorDirectory();
  return enrichAuthorIdentity(manifest, authorDirectory);
}

export async function buildRailyardProjectEmbedMetadata({
  type,
  id,
  version,
}: {
  type: RailyardRegistryType;
  id: string;
  version?: string;
}): Promise<Metadata | null> {
  const manifest = await getRegistryManifest(type, id);
  if (!manifest) return null;

  const projectName = resolveManifestName(manifest, id);
  const title = version
    ? `${projectName} ${version} Changelog | Railyard`
    : `${projectName} | Railyard`;
  const description = resolveManifestDescription(manifest, projectName);
  const image = resolveManifestEmbedImage(type, id, manifest);

  return buildEmbedMetadata({
    title,
    description,
    image,
  });
}
