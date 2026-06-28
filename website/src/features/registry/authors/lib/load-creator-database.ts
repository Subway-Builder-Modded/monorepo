import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";
import { getRegistryAuthorsIndexPath } from "@/features/registry/lib/registry-asset-paths";
import { loadRegistryItemsForType } from "@/features/registry/lib/load-registry-cache";
import { getRegistryAuthorUrl, getRegistryProjectUrl } from "@/features/registry/lib/routing";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";

export type RegistryCreatorDatabaseAuthor = {
  id: string;
  label: string;
  href: string;
  githubId: number | null;
  contributorTier: string | null;
  maps: number;
  mods: number;
  collaborations: number;
  assets: number;
  downloads: number;
};

export type RegistryCreatorDatabaseProject = {
  id: string;
  name: string;
  href: string;
  authorId: string;
  authorLabel: string;
  authorHref: string;
  maps: number;
  mods: number;
  assets: number;
  downloads: number;
};

export type RegistryCreatorDatabaseData = {
  authors: RegistryCreatorDatabaseAuthor[];
  projects: RegistryCreatorDatabaseProject[];
};

type RawAuthorsIndex = {
  authors?: Array<{
    github_id?: number | string;
    author_id?: string;
    author_alias?: string;
    contributor_tier?: string;
  }>;
};

function safeJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function safeFetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function normalizeId(value: string) {
  return value.trim().toLowerCase();
}

function toGithubId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getProjectName(projectId: string) {
  return projectId.split("/").filter(Boolean)[1] ?? projectId;
}

function getProjectAuthorId(projectId: string) {
  return projectId.split("/").filter(Boolean)[0] ?? projectId;
}

function buildAuthorLabels(authorsIndex: RawAuthorsIndex) {
  const labels = new Map<string, string>();

  for (const author of authorsIndex.authors ?? []) {
    const authorId = author.author_id?.trim();
    if (!authorId) continue;
    labels.set(normalizeId(authorId), author.author_alias?.trim() || authorId);
  }

  return labels;
}

function buildAuthors(
  authorsIndex: RawAuthorsIndex,
  allItems: RegistrySearchItem[],
): RegistryCreatorDatabaseAuthor[] {
  const authorsById = new Map<
    string,
    {
      id: string;
      label: string;
      githubId: number | null;
      contributorTier: string | null;
      maps: number;
      mods: number;
      collaborations: number;
      assets: number;
      downloads: number;
    }
  >();

  for (const author of authorsIndex.authors ?? []) {
    const id = author.author_id?.trim();
    if (!id) continue;
    const normalizedId = normalizeId(id);
    authorsById.set(normalizedId, {
      id,
      label: author.author_alias?.trim() || id,
      githubId: toGithubId(author.github_id),
      contributorTier: author.contributor_tier?.trim() || null,
      maps: 0,
      mods: 0,
      collaborations: 0,
      assets: 0,
      downloads: 0,
    });
  }

  for (const item of allItems) {
    const id = item.authorId?.trim() || item.author.trim();
    if (!id) continue;
    const normalizedId = normalizeId(id);
    const current = authorsById.get(normalizedId) ?? {
      id,
      label: item.author.trim() || id,
      githubId: null,
      contributorTier: null,
      maps: 0,
      mods: 0,
      collaborations: 0,
      assets: 0,
      downloads: 0,
    };
    if (item.type === "maps") current.maps += 1;
    if (item.type === "mods") current.mods += 1;
    current.assets += 1;
    current.downloads += item.totalDownloads;
    authorsById.set(normalizedId, current);
  }

  const authorIdByGithubId = new Map<number, string>();
  for (const author of authorsIndex.authors ?? []) {
    const githubId = toGithubId(author.github_id);
    const authorId = author.author_id?.trim();
    if (githubId === null || !authorId) continue;
    authorIdByGithubId.set(githubId, normalizeId(authorId));
  }

  for (const item of allItems) {
    const manifest = item.manifest as { collaborators?: unknown[] };
    const collaboratorIds = Array.isArray(manifest.collaborators) ? manifest.collaborators : [];
    const normalizedMainAuthorId = normalizeId(item.authorId ?? "");

    for (const collaboratorId of collaboratorIds) {
      const githubId = toGithubId(collaboratorId);
      if (githubId === null) continue;

      const normalizedAuthorId = authorIdByGithubId.get(githubId);
      if (!normalizedAuthorId || normalizedAuthorId === normalizedMainAuthorId) continue;

      const author = authorsById.get(normalizedAuthorId);
      if (!author) continue;
      author.collaborations += 1;
    }
  }

  return Array.from(authorsById.values())
    .filter((author) => author.assets > 0 || author.collaborations > 0)
    .map((author) => ({
      ...author,
      href: getRegistryAuthorUrl(author.id),
    }))
    .sort((left, right) => right.downloads - left.downloads);
}

function buildProjects(
  allItems: RegistrySearchItem[],
  authorLabels: Map<string, string>,
): RegistryCreatorDatabaseProject[] {
  const projects = new Map<
    string,
    {
      maps: number;
      mods: number;
      downloads: number;
    }
  >();

  for (const item of allItems) {
    const projectId = normalizeId(item.projectId ?? "");
    if (!projectId) continue;
    const current = projects.get(projectId) ?? { maps: 0, mods: 0, downloads: 0 };
    if (item.type === "maps") current.maps += 1;
    if (item.type === "mods") current.mods += 1;
    current.downloads += item.totalDownloads;
    projects.set(projectId, current);
  }

  return Array.from(projects.entries())
    .map(([id, totals]) => {
      const authorId = getProjectAuthorId(id);
      const name = getProjectName(id);
      return {
        id,
        name,
        href: getRegistryProjectUrl(authorId, name),
        authorId,
        authorLabel: authorLabels.get(normalizeId(authorId)) ?? authorId,
        authorHref: getRegistryAuthorUrl(authorId),
        maps: totals.maps,
        mods: totals.mods,
        assets: totals.maps + totals.mods,
        downloads: totals.downloads,
      };
    })
    .filter((project) => project.assets > 1)
    .sort((left, right) => right.downloads - left.downloads);
}

export async function loadCreatorDatabaseData(): Promise<RegistryCreatorDatabaseData> {
  const authorsIndexRaw = await safeFetchText(getRegistryAuthorsIndexPath());
  const authorsIndex = safeJson<RawAuthorsIndex>(authorsIndexRaw ?? "{}", {});
  const itemEntries = await Promise.all(
    REGISTRY_TYPES.map(async (typeConfig) =>
      loadRegistryItemsForType(typeConfig.id, typeConfig.routeSegment),
    ),
  );
  const allItems = itemEntries.flat();
  const authorLabels = buildAuthorLabels(authorsIndex);

  return {
    authors: buildAuthors(authorsIndex, allItems),
    projects: buildProjects(allItems, authorLabels),
  };
}
