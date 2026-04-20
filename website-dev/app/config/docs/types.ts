import type { SiteSuiteId } from "@/app/config/site-navigation";

export type DocsSuiteId = Extract<SiteSuiteId, "railyard" | "registry" | "template-mod">;
export type DocsRouteVersion = string | null;

export type DocsVersionStatus = "latest" | "supported" | "deprecated";

export type DocsVersionConfig = {
  value: string;
  label: string;
  status: DocsVersionStatus;
  releaseDate?: string;
  hidden?: boolean;
  badgeText?: string;
};

export type DocsSidebarOrderItem =
  | string
  | { key: string; children?: DocsSidebarOrderItem[] };

export type DocsHomepageConfig = {
  description: string;
  heroTitle?: string;
};

type DocsSuiteConfigBase = {
  suiteId: DocsSuiteId;
  enabled: boolean;
  editSourceBaseUrl: string;
  homepage: DocsHomepageConfig;
};

export type VersionedDocsSuiteConfig = DocsSuiteConfigBase & {
  versioned: true;
  latestVersion: string;
  versions: DocsVersionConfig[];
  sidebarOrderByVersion: Record<string, DocsSidebarOrderItem[]>;
};

export type NonVersionedDocsSuiteConfig = DocsSuiteConfigBase & {
  versioned: false;
  sidebarOrder: DocsSidebarOrderItem[];
};

export type DocsSuiteConfig = VersionedDocsSuiteConfig | NonVersionedDocsSuiteConfig;

export type DocsConfig = {
  suites: Record<DocsSuiteId, DocsSuiteConfig>;
};
