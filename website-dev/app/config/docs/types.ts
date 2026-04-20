import type { SiteSuiteId } from "@/app/config/site-navigation";

export type DocsSuiteId = Extract<SiteSuiteId, "railyard" | "registry" | "template-mod">;

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

export type DocsSuiteConfig = {
  suiteId: DocsSuiteId;
  enabled: boolean;
  editSourceBaseUrl: string;
  latestVersion: string;
  versions: DocsVersionConfig[];
  sidebarOrder: Record<string, DocsSidebarOrderItem[]>;
  homepage: DocsHomepageConfig;
};

export type DocsConfig = {
  suites: Record<DocsSuiteId, DocsSuiteConfig>;
};
