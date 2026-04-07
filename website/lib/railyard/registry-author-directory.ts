import {
  createRegistryAuthorDirectory,
  type RegistryAuthorDirectoryEntry,
} from '@/lib/authors';
import { fetchRegistryJsonWithFallback } from '@/lib/railyard/registry-source';
import type { RegistryAuthorsIndex } from '@/types/registry';

const AUTHORS_CACHE_PATH = '/registry/analytics/authors_index.json';

let authorDirectoryPromise: Promise<
  Map<string, RegistryAuthorDirectoryEntry>
> | null = null;

async function readRegistryAuthorDirectory(): Promise<
  Map<string, RegistryAuthorDirectoryEntry>
> {
  try {
    const response = await fetch(AUTHORS_CACHE_PATH, { cache: 'no-store' });
    if (response.ok) {
      const payload = (await response.json()) as RegistryAuthorsIndex;
      return createRegistryAuthorDirectory(payload);
    }
  } catch {
    // Fall back to direct registry fetch below.
  }

  try {
    const payload =
      await fetchRegistryJsonWithFallback<RegistryAuthorsIndex>(
        'authors/index.json',
      );
    return createRegistryAuthorDirectory(payload);
  } catch {
    return new Map<string, RegistryAuthorDirectoryEntry>();
  }
}

export async function getRegistryAuthorDirectory(): Promise<
  Map<string, RegistryAuthorDirectoryEntry>
> {
  if (!authorDirectoryPromise) {
    authorDirectoryPromise = readRegistryAuthorDirectory();
  }

  return authorDirectoryPromise;
}
