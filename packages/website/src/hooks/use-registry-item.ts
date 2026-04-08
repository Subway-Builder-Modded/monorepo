'use client';

import { useState, useEffect } from 'react';
import { enrichAuthorIdentity } from '@/lib/authors';
import { getRegistryAuthorDirectory } from '@/lib/railyard/registry-author-directory';
import { fetchRegistryJsonWithFallback } from '@/lib/railyard/registry-source';
import type { ModManifest, MapManifest } from '@/types/registry';

interface UseRegistryItemResult {
  item: ModManifest | MapManifest | null;
  loading: boolean;
  error: string | null;
}

export function useRegistryItem(
  type: 'mods' | 'maps',
  id: string,
): UseRegistryItemResult {
  const [item, setItem] = useState<ModManifest | MapManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchRegistryJsonWithFallback<
          ModManifest | MapManifest
        >(`${type}/${id}/manifest.json`);
        const authorDirectory = await getRegistryAuthorDirectory();
        if (!cancelled) setItem(enrichAuthorIdentity(data, authorDirectory));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load item');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [type, id]);

  return { item, loading, error };
}
