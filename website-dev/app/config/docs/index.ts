import type { DocsConfig, DocsSuiteConfig, DocsSuiteId, DocsVersionConfig } from "./types";
import { railyardDocsConfig } from "./suites/railyard";
import { registryDocsConfig } from "./suites/registry";
import { templateModDocsConfig } from "./suites/template-mod";

export type { DocsConfig, DocsSuiteConfig, DocsSuiteId, DocsVersionConfig };
export type { DocsSidebarOrderItem, DocsVersionStatus, DocsHomepageConfig } from "./types";
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

export function getDocsVersion(
  suiteId: DocsSuiteId,
  version: string,
): DocsVersionConfig | null {
  const suite = getDocsSuiteConfig(suiteId);
  if (!suite) return null;
  return suite.versions.find((v) => v.value === version) ?? null;
}

export function getLatestVersion(suiteId: DocsSuiteId): string | null {
  const suite = getDocsSuiteConfig(suiteId);
  return suite?.latestVersion ?? null;
}

export function getVisibleVersions(suiteId: DocsSuiteId): DocsVersionConfig[] {
  const suite = getDocsSuiteConfig(suiteId);
  if (!suite) return [];
  return suite.versions.filter((v) => !v.hidden);
}

export function getSidebarOrder(suiteId: DocsSuiteId, version: string) {
  const suite = getDocsSuiteConfig(suiteId);
  if (!suite) return [];
  return suite.sidebarOrder[version] ?? [];
}

export function isDocsSuiteId(id: string): id is DocsSuiteId {
  return id in DOCS_CONFIG.suites;
}

export function getEnabledDocsSuiteIds(): DocsSuiteId[] {
  return (Object.keys(DOCS_CONFIG.suites) as DocsSuiteId[]).filter(
    (id) => DOCS_CONFIG.suites[id].enabled,
  );
}
