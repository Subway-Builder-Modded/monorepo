import type { SiteSuiteId } from "@/app/config/site-navigation";
import type { LucideIcon } from "lucide-react";

export type DocsSuiteId = Extract<SiteSuiteId, "railyard" | "registry" | "template-mod">;
export type DocsRouteVersion = string | null;

export type DocsVersionStatus = "latest" | "supported" | "deprecated";

export type DocsFrontmatter = {
  title: string;
  description: string;
  icon: string;
  hidden?: boolean;
};

export type DocsVersionConfig = {
  value: string;
  label: string;
  status: DocsVersionStatus;
  defaultDoc?: string;
  releaseDate?: string;
  hidden?: boolean;
  badgeText?: string;
};

export type DocsHomepageActionConfig = {
  label: string;
  href: string;
  icon?: LucideIcon;
  external?: boolean;
};

export type DocsHomepageActions =
  | []
  | [DocsHomepageActionConfig]
  | [DocsHomepageActionConfig, DocsHomepageActionConfig];

export type DocsSidebarOrderItem = string | { key: string; children?: DocsSidebarOrderItem[] };

export type DocsHomepageConfig = {
  description: string;
  actions?: DocsHomepageActions;
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
