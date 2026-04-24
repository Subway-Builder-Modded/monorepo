import {
  UPDATES_DEFAULT_HOMEPAGE_DESCRIPTION,
  UPDATES_HOMEPAGE_ICON,
  UPDATES_HOMEPAGE_TITLE,
  type UpdatesSuiteId,
} from "@/config/updates";
import { getSuiteUpdatesNavItem } from "@/config/site-navigation";
import type { UpdateEntry } from "./types";

/**
 * Returns the homepage description for an updates suite.
 * Single source of truth is the site-navigation Updates nav item description,
 * matching the same pattern used by the docs feature.
 */
export function getUpdatesHomepageDescription(suiteId: UpdatesSuiteId): string {
  return getSuiteUpdatesNavItem(suiteId)?.description ?? UPDATES_DEFAULT_HOMEPAGE_DESCRIPTION;
}

export function getUpdatesHomepageIdentity(suiteId: UpdatesSuiteId) {
  return {
    title: UPDATES_HOMEPAGE_TITLE,
    icon: UPDATES_HOMEPAGE_ICON,
    description: getUpdatesHomepageDescription(suiteId),
  };
}

export function getUpdateArticleIdentity(entry: UpdateEntry | null) {
  if (!entry) {
    return {
      title: "Updates",
      description: UPDATES_DEFAULT_HOMEPAGE_DESCRIPTION,
    };
  }

  return {
    title: entry.frontmatter.title,
    description: `${entry.id} • ${entry.frontmatter.date}`,
  };
}
