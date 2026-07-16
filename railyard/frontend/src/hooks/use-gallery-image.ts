import {
  type AssetType,
  assetTypeToListingPath,
} from '@subway-builder-modded/config';
import { useEffect, useState } from 'react';

import { markFirst } from '@/lib/perf';

import { GetGalleryServerPort } from '../../wailsjs/go/main/App';

// Images are served as full-resolution URLs by the gallery server.
// Decode each image off the main thread via img.decode() before showing it, so the main thread doesn't freeze when many cards mount at once.
let cachedPort: number | null = null;
let portPromise: Promise<number | null> | null = null;

function fetchGalleryPort(): Promise<number | null> {
  if (cachedPort !== null) return Promise.resolve(cachedPort);
  if (!portPromise) {
    portPromise = GetGalleryServerPort()
      .then((port) => {
        cachedPort = port && port > 0 ? port : null;
        return cachedPort;
      })
      .catch(() => null);
  }
  return portPromise;
}

function galleryImageUrl(
  port: number,
  type: AssetType,
  id: string,
  imagePath: string,
): string {
  const segments = [assetTypeToListingPath(type), id, ...imagePath.split('/')];
  return `http://127.0.0.1:${port}/gallery/${segments.map(encodeURIComponent).join('/')}`;
}

// Dedup off-main-thread decodes so an image is only decoded once and
// tab switches (which remount cards) reuse the already-decoded result.
const decoded = new Set<string>();
const decoding = new Map<string, Promise<boolean>>();

function decodeGalleryImage(url: string): Promise<boolean> {
  if (decoded.has(url)) return Promise.resolve(true);
  let promise = decoding.get(url);
  if (!promise) {
    const img = new Image();
    img.src = url;
    promise = img
      .decode()
      .then(() => {
        decoded.add(url);
        // First off-thread decode to complete ~ first gallery paint; a proxy for how long
        // the initial card render takes to become visible.
        markFirst('gallery.firstImageDecoded');
        return true;
      })
      .catch(() => false)
      .finally(() => {
        decoding.delete(url);
      });
    decoding.set(url, promise);
  }
  return promise;
}

async function resolveGalleryUrl(
  type: AssetType,
  id: string,
  imagePath: string,
): Promise<string | null> {
  const port = await fetchGalleryPort();
  return port === null ? null : galleryImageUrl(port, type, id, imagePath);
}

// preloadGalleryImage resolves and off-thread-decodes an image ahead of render.
export async function preloadGalleryImage(
  type?: AssetType,
  id?: string,
  imagePath?: string,
): Promise<void> {
  if (!type || !id || !imagePath) {
    await fetchGalleryPort();
    return;
  }
  const url = await resolveGalleryUrl(type, id, imagePath);
  if (url) await decodeGalleryImage(url);
}

// useGalleryImage returns the image URL once it has been decoded off the main thread. While
// resolving/decoding it reports loading so the card shows its skeleton.
export function useGalleryImage(
  type: AssetType,
  id: string,
  imagePath?: string,
): { imageUrl: string | null; loading: boolean; error: boolean } {
  const [state, setState] = useState<{
    url: string | null;
    loading: boolean;
    error: boolean;
  }>(() => ({ url: null, loading: Boolean(imagePath), error: false }));

  useEffect(() => {
    if (!imagePath) {
      setState({ url: null, loading: false, error: false });
      return;
    }
    let cancelled = false;
    setState({ url: null, loading: true, error: false });

    void (async () => {
      const url = await resolveGalleryUrl(type, id, imagePath);
      if (cancelled) return;
      if (!url) {
        setState({ url: null, loading: false, error: true });
        return;
      }
      const ok = await decodeGalleryImage(url);
      if (cancelled) return;
      setState({ url: ok ? url : null, loading: false, error: !ok });
    })();

    return () => {
      cancelled = true;
    };
  }, [type, id, imagePath]);

  return { imageUrl: state.url, loading: state.loading, error: state.error };
}
