'use client';

import { useEffect, useState } from 'react';

import { buildGalleryCdnUrl, buildGalleryUrl } from '@/hooks/use-registry';
import {
  getRawRegistryUrls,
  getRegistryCdnUrls,
} from '@/lib/railyard/registry-source';

interface GalleryImageCacheEntry {
  imageUrl: string | null;
  error: boolean;
}

const galleryImageCache = new Map<string, GalleryImageCacheEntry>();
const galleryImageRequests = new Map<string, Promise<GalleryImageCacheEntry>>();

function getCacheKey(type: 'mods' | 'maps', id: string, imagePath: string) {
  return `${type}:${id}:${imagePath}`;
}

async function preloadBrowserImage(imageUrl: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imageUrl;
  });
}

async function resolveFirstWorkingImageUrl(
  type: 'mods' | 'maps',
  id: string,
  imagePath: string,
): Promise<string | null> {
  const path = `${type}/${id}/${imagePath}`;
  const candidates = Array.from(
    new Set([
      ...getRawRegistryUrls(path),
      ...getRegistryCdnUrls(path),
      buildGalleryUrl(type, id, imagePath),
      buildGalleryCdnUrl(type, id, imagePath),
    ]),
  );

  for (const url of candidates) {
    try {
      const loaded = await preloadBrowserImage(url);
      if (loaded) return url;
    } catch {
      continue;
    }
  }

  return null;
}

async function requestGalleryImage(
  type: 'mods' | 'maps',
  id: string,
  imagePath: string,
): Promise<GalleryImageCacheEntry> {
  try {
    const imageUrl = await resolveFirstWorkingImageUrl(type, id, imagePath);
    if (!imageUrl) {
      return { imageUrl: null, error: true };
    }
    return { imageUrl, error: false };
  } catch {
    return { imageUrl: null, error: true };
  }
}

function getOrRequestGalleryImage(
  type: 'mods' | 'maps',
  id: string,
  imagePath: string,
): Promise<GalleryImageCacheEntry> {
  const cacheKey = getCacheKey(type, id, imagePath);
  const cached = galleryImageCache.get(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }

  const inFlight = galleryImageRequests.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    try {
      const entry = await requestGalleryImage(type, id, imagePath);
      galleryImageCache.set(cacheKey, entry);
      return entry;
    } finally {
      galleryImageRequests.delete(cacheKey);
    }
  })();

  galleryImageRequests.set(cacheKey, request);
  return request;
}

export async function preloadGalleryImage(
  type: 'mods' | 'maps',
  id: string,
  imagePath?: string,
): Promise<void> {
  if (!imagePath) {
    return;
  }
  await getOrRequestGalleryImage(type, id, imagePath);
}

export function useGalleryImage(
  type: 'mods' | 'maps',
  id: string,
  imagePath?: string,
) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imagePath) {
      setImageUrl(null);
      setError(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const cacheKey = getCacheKey(type, id, imagePath);
    const cached = galleryImageCache.get(cacheKey);
    if (cached) {
      setImageUrl(cached.imageUrl);
      setError(cached.error);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    const loadImage = async () => {
      try {
        const entry = await getOrRequestGalleryImage(type, id, imagePath);
        if (!cancelled) {
          setImageUrl(entry.imageUrl);
          setError(entry.error);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setImageUrl(null);
          setError(true);
          setLoading(false);
        }
      }
    };
    void loadImage();

    return () => {
      cancelled = true;
    };
  }, [type, id, imagePath]);

  return { imageUrl, loading, error };
}
