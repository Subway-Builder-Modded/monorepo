import type { CreditsContributorTier, RegistryAuthorsIndex } from "@/features/credits/lib/types";
import { getRegistryAuthorsIndexPath } from "@/features/registry/lib/registry-asset-paths";

export type RegistryAuthorRole = {
  kind: "maintainer" | "contributor";
  tier: CreditsContributorTier;
};

let roleMapPromise: Promise<Map<string, RegistryAuthorRole>> | null = null;

function trimToUndefined(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeTier(value?: string | null): CreditsContributorTier | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "developer") return "developer";
  if (normalized === "collaborator") return "collaborator";
  if (normalized === "executive") return "executive";
  if (normalized === "conductor") return "conductor";
  if (normalized === "engineer") return "engineer";
  return null;
}

async function fetchRegistryJson<T>(path: string): Promise<T | null> {
  if (typeof fetch !== "function") {
    return null;
  }

  try {
    const response = await fetch(path);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function loadRoleMap(): Promise<Map<string, RegistryAuthorRole>> {
  const authorsIndex = await fetchRegistryJson<RegistryAuthorsIndex>(getRegistryAuthorsIndexPath());

  const map = new Map<string, RegistryAuthorRole>();

  for (const entry of authorsIndex?.authors ?? []) {
    const authorId = trimToUndefined(entry.author_id)?.toLowerCase();
    const tier = normalizeTier(entry.contributor_tier);
    const roles = entry.credit_roles ?? [];
    if (!authorId || !tier) {
      continue;
    }

    // Maintainer roles take precedence when an entry carries both.
    if (roles.includes("maintainer")) {
      map.set(authorId, { kind: "maintainer", tier });
    } else if (roles.includes("supporter")) {
      map.set(authorId, { kind: "contributor", tier });
    }
  }

  return map;
}

function getRoleMapPromise() {
  roleMapPromise ??= loadRoleMap();
  return roleMapPromise;
}

export async function resolveRegistryAuthorRole(
  authorId: string | null | undefined,
): Promise<RegistryAuthorRole | null> {
  const normalizedAuthorId = authorId?.trim().toLowerCase();
  if (!normalizedAuthorId) {
    return null;
  }

  const roleMap = await getRoleMapPromise();
  return roleMap.get(normalizedAuthorId) ?? null;
}
