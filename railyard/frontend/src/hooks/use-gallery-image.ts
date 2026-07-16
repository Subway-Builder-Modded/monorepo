import {
  type AssetType,
  assetTypeToListingPath,
} from '@subway-builder-modded/config';
import { useEffect, useState } from 'react';

import { GetGalleryServerPort } from '../../wailsjs/go/main/App';

// Images are served as full-resolution URLs by the gallery server and handed straight to
// <img loading="lazy" decoding="async">.
// Do NOT gate on img.decode(): letting the webview load/decode each image natively means only on-screen images load, and they stream in one
// at a time instead of the whole grid locking on a skeleton until every image has decoded.
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

// resolveGalleryUrlSync builds the URL immediately when the port is already known, so a card can
// render its <img> on the first paint once the server port has been fetched.
function resolveGalleryUrlSync(
  type: AssetType,
  id: string,
  imagePath: string,
): string | null {
  return cachedPort === null
    ? null
    : galleryImageUrl(cachedPort, type, id, imagePath);
}

// preloadGalleryImage only ensures the gallery server port is known, so the first batch of cards
// can resolve their URLs synchronously.
export async function preloadGalleryImage(
  _type?: AssetType,
  _id?: string,
  _imagePath?: string,
): Promise<void> {
  await fetchGalleryPort();
}

// useGalleryImage returns the image URL as soon as it can (synchronously once the port is cached)
// and lets the browser load/decode the image progressively.
export function useGalleryImage(
  type: AssetType,
  id: string,
  imagePath?: string,
): { imageUrl: string | null; loading: boolean; error: boolean } {
  const [url, setUrl] = useState<string | null>(() =>
    imagePath ? resolveGalleryUrlSync(type, id, imagePath) : null,
  );
  // loading is only true while the port is still being fetched for the very first image on a cold start.
  const [loading, setLoading] = useState(
    () => Boolean(imagePath) && cachedPort === null,
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imagePath) {
      setUrl(null);
      setLoading(false);
      setError(false);
      return;
    }

    const immediate = resolveGalleryUrlSync(type, id, imagePath);
    if (immediate !== null) {
      setUrl(immediate);
      setLoading(false);
      setError(false);
      return;
    }

    // Port not resolved yet (first image on a cold start): fetch it once, then build the URL.
    let cancelled = false;
    setLoading(true);
    setError(false);
    void fetchGalleryPort().then((port) => {
      if (cancelled) return;
      if (port === null) {
        setUrl(null);
        setError(true);
      } else {
        setUrl(galleryImageUrl(port, type, id, imagePath));
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [type, id, imagePath]);

  return { imageUrl: url, loading, error };
}
