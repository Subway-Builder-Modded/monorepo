import type { UpdatesConfig, UpdatesSuiteConfig, UpdatesSuiteId } from "./types";
import { railyardUpdatesConfig } from "../railyard/updates";
import { templateModUpdatesConfig } from "../template-mod/updates";
import { websiteUpdatesConfig } from "../website/updates";
import { depotUpdatesConfig } from "../depot/updates";

export type {
  UpdatesConfig,
  UpdatesSuiteConfig,
  UpdatesSuiteId,
  UpdatesTag,
  UpdatesTagPresentation,
  UpdatesFrontmatter,
  UpdatesHomepageActionConfig,
  UpdatesHomepageActions,
  UpdatesChangelogActionContext,
  UpdatesChangelogActionConfig,
  UpdatesChangelogActions,
} from "./types";

export {
  UPDATES_CONTENT_ROOT,
  UPDATES_GITHUB_BASE_URL,
  UPDATES_HOMEPAGE_TITLE,
  UPDATES_HOMEPAGE_ICON,
  UPDATES_DEFAULT_HOMEPAGE_DESCRIPTION,
  UPDATES_TAG_PRESENTATION,
} from "./shared";
export {
  CHANGELOG_CATEGORIES,
  type ChangelogCategoryConfig,
  type ChangelogCategoriesConfig,
} from "./changelog-categories";

export const UPDATES_CONFIG: UpdatesConfig = {
  suites: {
    railyard: railyardUpdatesConfig,
    "template-mod": templateModUpdatesConfig,
    website: websiteUpdatesConfig,
    depot: depotUpdatesConfig,
  },
};

export function getUpdatesSuiteConfig(suiteId: UpdatesSuiteId): UpdatesSuiteConfig | null {
  const config = UPDATES_CONFIG.suites[suiteId];
  return config?.enabled ? config : null;
}

export function isUpdatesSuiteId(id: string): id is UpdatesSuiteId {
  return id in UPDATES_CONFIG.suites;
}

export function getEnabledUpdatesSuiteIds(): UpdatesSuiteId[] {
  return (Object.keys(UPDATES_CONFIG.suites) as UpdatesSuiteId[]).filter(
    (id) => UPDATES_CONFIG.suites[id].enabled,
  );
}
