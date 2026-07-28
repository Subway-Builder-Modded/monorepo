import type {
  CreditsContributorTier,
  CreditsDirectory,
  CreditsPerson,
  CreditsSection,
  CreditsSubsection,
  CreditsSubsectionId,
  RegistryAuthorsIndex,
} from "./types";
import { getRegistryAuthorsIndexPath } from "@/features/registry/lib/registry-asset-paths";

const TIER_TITLE_BY_ID: Record<CreditsSubsectionId, string> = {
  developer: "Developer",
  collaborator: "Collaborator",
  executive: "Executive",
  conductor: "Conductor",
  engineer: "Engineer",
};

const MAINTAINER_SUBSECTIONS: CreditsSubsectionId[] = ["developer", "collaborator"];
const CONTRIBUTOR_SUBSECTIONS: CreditsSubsectionId[] = ["executive", "conductor", "engineer"];

const SECTION_BASE: Record<CreditsSection["id"], Omit<CreditsSection, "subsections">> = {
  maintainers: {
    id: "maintainers",
    title: "Maintainers",
    description: "The maintainers who push Subway Builder Modded development forward.",
  },
  contributors: {
    id: "contributors",
    title: "Contributors",
    description:
      "The community supporters whose donations keep Subway Builder Modded moving forward.",
  },
};

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

function createTierBuckets(): Record<CreditsSubsectionId, CreditsPerson[]> {
  return {
    developer: [],
    collaborator: [],
    executive: [],
    conductor: [],
    engineer: [],
  };
}

function createSubsections(
  subsectionIds: CreditsSubsectionId[],
  peopleByTier: Record<CreditsSubsectionId, CreditsPerson[]>,
): CreditsSubsection[] {
  const subsections: CreditsSubsection[] = [];

  for (const subsectionId of subsectionIds) {
    const people = peopleByTier[subsectionId];
    if (people.length === 0) {
      continue;
    }

    subsections.push({
      id: subsectionId,
      title: TIER_TITLE_BY_ID[subsectionId],
      people,
    });
  }

  return subsections;
}

async function fetchRegistryJson<T>(path: string, fetchImpl: typeof fetch): Promise<T | null> {
  try {
    const response = await fetchImpl(path);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Builds the credits directory from the unified registry authors index.
 * Entries carrying a `credit_roles` marker are credited people — maintainers
 * and ko-fi supporters — including credit-only entries with no listings.
 * The maintainer role takes precedence when an entry carries both.
 */
export function buildCreditsDirectory(
  authorsIndex: RegistryAuthorsIndex | null | undefined,
): CreditsDirectory {
  const peopleByTier = createTierBuckets();

  for (const entry of authorsIndex?.authors ?? []) {
    const roles = entry.credit_roles ?? [];
    const isMaintainer = roles.includes("maintainer");
    const isSupporter = roles.includes("supporter");
    if (!isMaintainer && !isSupporter) continue;

    const tier = normalizeTier(entry.contributor_tier);
    if (!tier) continue;

    const displayName =
      trimToUndefined(entry.author_alias) ??
      trimToUndefined(entry.author_id) ??
      trimToUndefined(entry.ko_fi_username);
    if (!displayName) continue;

    const source = isMaintainer ? "maintainers" : "supporters";
    const personId =
      trimToUndefined(entry.author_id) ?? trimToUndefined(entry.ko_fi_username) ?? displayName;

    peopleByTier[tier].push({
      key: `${isMaintainer ? "m" : "s"}:${personId.toLowerCase()}`,
      displayName,
      tier,
      source,
      link: trimToUndefined(entry.attribution_link),
    });
  }

  const maintainersSubsections = createSubsections(MAINTAINER_SUBSECTIONS, peopleByTier);
  const contributorsSubsections = createSubsections(CONTRIBUTOR_SUBSECTIONS, peopleByTier);

  const sections: CreditsSection[] = [];

  if (maintainersSubsections.length > 0) {
    sections.push({
      ...SECTION_BASE.maintainers,
      subsections: maintainersSubsections,
    });
  }

  if (contributorsSubsections.length > 0) {
    sections.push({
      ...SECTION_BASE.contributors,
      subsections: contributorsSubsections,
    });
  }

  return { sections };
}

export async function loadCreditsDirectory(
  fetchImpl: typeof fetch = fetch,
): Promise<CreditsDirectory> {
  const authorsIndex = await fetchRegistryJson<RegistryAuthorsIndex>(
    getRegistryAuthorsIndexPath(),
    fetchImpl,
  );

  return buildCreditsDirectory(authorsIndex);
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
