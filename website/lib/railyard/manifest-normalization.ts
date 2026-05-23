import { normalizeMapCountry } from '@subway-builder-modded/asset-listings-state';

import type { MapManifest, ModManifest } from '@/types/registry';

type RegistryManifest = ModManifest | MapManifest;

function isMapManifest(manifest: RegistryManifest): manifest is MapManifest {
  return 'city_code' in manifest;
}

export function normalizeRegistryManifest<T extends RegistryManifest>(
  manifest: T,
): T {
  if (!isMapManifest(manifest)) {
    return manifest;
  }

  const country = normalizeMapCountry(manifest.country);
  return country === (manifest.country ?? '')
    ? manifest
    : ({ ...manifest, country } as T);
}
