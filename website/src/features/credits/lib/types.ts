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

export type RegistryAuthorsIndexEntry = {
  github_id?: number;
  author_id?: string;
  author_alias?: string;
  attribution_link?: string;
  ko_fi_username?: string;
  contributor_tier?: string | null;
  credit_roles?: string[];
};

export type RegistryAuthorsIndex = {
  schema_version?: number;
  authors?: RegistryAuthorsIndexEntry[];
};
