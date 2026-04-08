import type {
  ContributorTier,
  RegistryAuthorsIndex,
  RegistryAuthorsIndexEntry,
} from '@/types/registry';

export type AuthorIdentity = {
  author: string;
  author_alias?: string | null;
  attribution_link?: string | null;
  contributor_tier?: ContributorTier | null;
};

export type RegistryAuthorDirectoryEntry = {
  author: string;
  author_alias?: string;
  attribution_link?: string;
  contributor_tier: ContributorTier | null;
  github_id?: number;
};

function trimToUndefined(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function normalizeContributorTier(
  value?: string | null,
): ContributorTier | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'developer') return 'developer';
  if (normalized === 'engineer') return 'engineer';
  if (normalized === 'conductor') return 'conductor';
  if (normalized === 'executive') return 'executive';
  return null;
}

function toDirectoryEntry(
  entry: RegistryAuthorsIndexEntry,
): RegistryAuthorDirectoryEntry | null {
  const author = trimToUndefined(entry.author_id);
  if (!author) return null;

  return {
    author,
    author_alias: trimToUndefined(entry.author_alias),
    attribution_link: trimToUndefined(entry.attribution_link),
    contributor_tier: normalizeContributorTier(entry.contributor_tier),
    github_id: entry.github_id,
  };
}

export function createRegistryAuthorDirectory(
  payload?: RegistryAuthorsIndex | null,
): Map<string, RegistryAuthorDirectoryEntry> {
  const directory = new Map<string, RegistryAuthorDirectoryEntry>();

  for (const rawEntry of payload?.authors ?? []) {
    const entry = toDirectoryEntry(rawEntry);
    if (!entry) continue;
    directory.set(entry.author.toLowerCase(), entry);
  }

  return directory;
}

export function enrichAuthorIdentity<T extends AuthorIdentity>(
  value: T,
  directory: Map<string, RegistryAuthorDirectoryEntry>,
): T {
  const authorKey = value.author.trim().toLowerCase();
  if (!authorKey) return value;

  const match = directory.get(authorKey);
  if (!match) return value;

  return {
    ...value,
    author_alias: trimToUndefined(value.author_alias) ?? match.author_alias,
    attribution_link:
      trimToUndefined(value.attribution_link) ?? match.attribution_link,
    contributor_tier: value.contributor_tier ?? match.contributor_tier,
  };
}

export function getAuthorDisplayName(author: {
  author: string;
  author_alias?: string | null;
}): string {
  return trimToUndefined(author.author_alias) ?? author.author;
}

export function getAuthorAttributionHref(author: {
  author: string;
  attribution_link?: string | null;
}): string {
  return (
    trimToUndefined(author.attribution_link) ??
    `/registry/authors/${encodeURIComponent(author.author)}`
  );
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
