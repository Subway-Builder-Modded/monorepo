import type {
  CreditsContributorTier,
  RegistryMaintainersIndex,
  RegistrySupportersIndex,
} from "@/features/credits/lib/types";
import { getRegistryCreditsCachePath } from "@/features/registry/lib/registry-asset-paths";

export type RegistryAuthorRole = {
  kind: "maintainer" | "contributor";
  tier: CreditsContributorTier;
};

const MAINTAINERS_INDEX_PATH = getRegistryCreditsCachePath("maintainers.json");
const SUPPORTERS_INDEX_PATH = getRegistryCreditsCachePath("supporters.json");

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
  const [maintainersIndex, supportersIndex] = await Promise.all([
    fetchRegistryJson<RegistryMaintainersIndex>(MAINTAINERS_INDEX_PATH),
    fetchRegistryJson<RegistrySupportersIndex>(SUPPORTERS_INDEX_PATH),
  ]);

  const map = new Map<string, RegistryAuthorRole>();

  for (const maintainer of maintainersIndex?.maintainers ?? []) {
    const sbmId = trimToUndefined(maintainer.sbm_id)?.toLowerCase();
    const tier = normalizeTier(maintainer.contributor_tier);
    if (!sbmId || !tier) {
      continue;
    }

    map.set(sbmId, { kind: "maintainer", tier });
  }

  for (const supporter of supportersIndex?.ko_fi ?? []) {
    const sbmId = trimToUndefined(supporter.sbm_id)?.toLowerCase();
    const tier = normalizeTier(supporter.contributor_tier);
    if (!sbmId || !tier) {
      continue;
    }

    // Maintainer roles take precedence when both records exist.
    if (!map.has(sbmId)) {
      map.set(sbmId, { kind: "contributor", tier });
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
