export type CreditsPageId = "credits";

export type CreditsRouteMatch = { kind: "none" } | { kind: "page"; pageId: CreditsPageId };

export type CreditsContributorTier =
  | "developer"
  | "collaborator"
  | "executive"
  | "conductor"
  | "engineer";

export type CreditsSectionId = "maintainers" | "contributors";

export type CreditsSubsectionId = CreditsContributorTier;

export type CreditsPerson = {
  key: string;
  displayName: string;
  tier: CreditsContributorTier;
  source: "maintainers" | "supporters";
  link?: string;
};

export type CreditsSubsection = {
  id: CreditsSubsectionId;
  title: string;
  people: CreditsPerson[];
};

export type CreditsSection = {
  id: CreditsSectionId;
  title: string;
  description: string;
  subsections: CreditsSubsection[];
};

export type CreditsDirectory = {
  sections: CreditsSection[];
};

export type RegistryMaintainerEntry = {
  sbm_id?: string;
  maintainer_alias?: string;
  attribution_link?: string;
  contributor_tier?: string | null;
};

export type RegistryMaintainersIndex = {
  schema_version?: number;
  maintainers?: RegistryMaintainerEntry[];
};

export type RegistrySupporterEntry = {
  sbm_id?: string;
  ko_fi_username?: string;
  supporter_alias?: string;
  attribution_link?: string;
  contributor_tier?: string | null;
};

export type RegistrySupportersIndex = {
  schema_version?: number;
  ko_fi?: RegistrySupporterEntry[];
};
