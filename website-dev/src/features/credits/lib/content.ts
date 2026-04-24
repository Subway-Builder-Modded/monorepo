import type {
  CreditsContributorTier,
  CreditsDirectory,
  CreditsPerson,
  CreditsSection,
  CreditsSubsection,
  CreditsSubsectionId,
  RegistryMaintainersIndex,
  RegistrySupportersIndex,
} from "./types";

const MAINTAINERS_INDEX_PATH = "/registry/credits/maintainers.json";
const SUPPORTERS_INDEX_PATH = "/registry/credits/supporters.json";

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
    description:
      "The maintainers who push Subway Builder Modded development forward.",
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

export function buildCreditsDirectory(
  maintainersIndex: RegistryMaintainersIndex | null | undefined,
  supportersIndex: RegistrySupportersIndex | null | undefined,
): CreditsDirectory {
  const peopleByTier = createTierBuckets();
  const maintainerIds = new Set<string>();

  for (const entry of maintainersIndex?.maintainers ?? []) {
    const maintainerId = trimToUndefined(entry.sbm_id);
    if (maintainerId) {
      maintainerIds.add(maintainerId.toLowerCase());
    }

    const tier = normalizeTier(entry.contributor_tier);
    if (!tier) continue;

    const displayName = trimToUndefined(entry.maintainer_alias) ?? trimToUndefined(entry.sbm_id);
    if (!displayName) continue;

    const link = trimToUndefined(entry.attribution_link);
    const key = maintainerId ? `m:${maintainerId.toLowerCase()}` : `m:${displayName.toLowerCase()}`;

    peopleByTier[tier].push({
      key,
      displayName,
      tier,
      source: "maintainers",
      link,
    });
  }

  for (const supporter of supportersIndex?.ko_fi ?? []) {
    const supporterMaintainerId = trimToUndefined(supporter.sbm_id);
    if (supporterMaintainerId && maintainerIds.has(supporterMaintainerId.toLowerCase())) {
      continue;
    }

    const tier = normalizeTier(supporter.contributor_tier);
    if (!tier) continue;

    const displayName =
      trimToUndefined(supporter.supporter_alias) ??
      trimToUndefined(supporter.ko_fi_username) ??
      trimToUndefined(supporter.sbm_id);
    if (!displayName) continue;

    const link = trimToUndefined(supporter.attribution_link);
    const supporterId =
      trimToUndefined(supporter.sbm_id) ??
      trimToUndefined(supporter.ko_fi_username) ??
      displayName;

    peopleByTier[tier].push({
      key: `s:${supporterId.toLowerCase()}`,
      displayName,
      tier,
      source: "supporters",
      link,
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

export async function loadCreditsDirectory(fetchImpl: typeof fetch = fetch): Promise<CreditsDirectory> {
  const [maintainersIndex, supportersIndex] = await Promise.all([
    fetchRegistryJson<RegistryMaintainersIndex>(MAINTAINERS_INDEX_PATH, fetchImpl),
    fetchRegistryJson<RegistrySupportersIndex>(SUPPORTERS_INDEX_PATH, fetchImpl),
  ]);

  return buildCreditsDirectory(maintainersIndex, supportersIndex);
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
