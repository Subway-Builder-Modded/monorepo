import type {
  DocsConfig,
  DocsRouteVersion,
  DocsSidebarOrderItem,
  DocsSuiteConfig,
  DocsSuiteId,
  DocsVersionConfig,
} from "./types";
import { railyardDocsConfig } from "../railyard/docs";
import { registryDocsConfig } from "../registry/docs";
import { templateModDocsConfig } from "../template-mod/docs";

export type { DocsConfig, DocsSuiteConfig, DocsSuiteId, DocsVersionConfig, DocsRouteVersion };
export type {
  DocsSidebarOrderItem,
  DocsVersionStatus,
  DocsHomepageConfig,
  DocsHomepageActionConfig,
  DocsHomepageActionContext,
  DocsHomepageActions,
  DocsFrontmatter,
} from "./types";
export { DOCS_GITHUB_BASE_URL, DOCS_CONTENT_ROOT } from "./shared";

export const DOCS_CONFIG: DocsConfig = {
  suites: {
    railyard: railyardDocsConfig,
    registry: registryDocsConfig,
    "template-mod": templateModDocsConfig,
  },
};

export function getDocsSuiteConfig(suiteId: DocsSuiteId): DocsSuiteConfig | null {
  const config = DOCS_CONFIG.suites[suiteId];
  return config?.enabled ? config : null;
}

export function isVersionedDocsSuite(suiteId: DocsSuiteId): boolean {
  const suite = getDocsSuiteConfig(suiteId);
  return suite?.versioned === true;
}

export function getDocsVersion(suiteId: DocsSuiteId, version: string): DocsVersionConfig | null {
  const suite = getDocsSuiteConfig(suiteId);
  if (!suite || !suite.versioned) return null;
  return suite.versions.find((v) => v.value === version) ?? null;
}

export function getDefaultDocForVersion(suiteId: DocsSuiteId, version: string): string | null {
  const versionConfig = getDocsVersion(suiteId, version);
  return versionConfig?.defaultDoc ?? null;
}

export function getLatestVersion(suiteId: DocsSuiteId): string | null {
  const suite = getDocsSuiteConfig(suiteId);
  if (!suite || !suite.versioned) return null;
  return suite.latestVersion;
}

export function getVisibleVersions(suiteId: DocsSuiteId): DocsVersionConfig[] {
  const suite = getDocsSuiteConfig(suiteId);
  if (!suite || !suite.versioned) return [];
  return suite.versions.filter((v) => !v.hidden);
}

/**
 * True when a versioned suite exposes more than one selectable version.
 * Versioned suites with a single visible version should behave as
 * unversioned in the UI (no version chooser, no version separator).
 */
export function hasMultipleVisibleVersions(suiteId: DocsSuiteId): boolean {
  return getVisibleVersions(suiteId).length > 1;
}

export function getSidebarOrder(
  suiteId: DocsSuiteId,
  version: DocsRouteVersion,
): DocsSidebarOrderItem[] {
  const suite = getDocsSuiteConfig(suiteId);
  if (!suite) return [];

  if (!suite.versioned) {
    return suite.sidebarOrder;
  }

  if (!version) {
    return [];
  }

  return suite.sidebarOrderByVersion[version] ?? [];
}

export function getDefaultRouteVersion(suiteId: DocsSuiteId): DocsRouteVersion {
  const suite = getDocsSuiteConfig(suiteId);
  if (!suite) return null;
  return suite.versioned ? suite.latestVersion : null;
}

export function isDocsSuiteId(id: string): id is DocsSuiteId {
  return id in DOCS_CONFIG.suites;
}

export function getEnabledDocsSuiteIds(): DocsSuiteId[] {
  return (Object.keys(DOCS_CONFIG.suites) as DocsSuiteId[]).filter(
    (id) => DOCS_CONFIG.suites[id].enabled,
  );
}
