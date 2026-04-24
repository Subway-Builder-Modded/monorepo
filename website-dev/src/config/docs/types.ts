import type { SiteSuiteId } from "@/config/site-navigation";
import type { HeadingActionConfig, HeadingActions } from "@/config/shared/heading-actions";

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

export type DocsHomepageActionContext = {
  suiteId: DocsSuiteId;
  version: DocsRouteVersion;
};

export type DocsHomepageActionConfig = HeadingActionConfig<DocsHomepageActionContext>;

export type DocsHomepageActions = HeadingActions<DocsHomepageActionContext>;

export type DocsSidebarOrderItem = string | { key: string; children?: DocsSidebarOrderItem[] };

export type DocsHomepageConfig = {
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
