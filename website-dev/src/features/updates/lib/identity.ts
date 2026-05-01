import {
  UPDATES_DEFAULT_HOMEPAGE_DESCRIPTION,
  UPDATES_HOMEPAGE_ICON,
  UPDATES_HOMEPAGE_TITLE,
  type UpdatesSuiteId,
} from "@/config/updates";
import { getSuiteUpdatesNavItem } from "@/config/site-navigation";
import type { UpdateEntry } from "./types";

const SUITE_TITLE_PREFIX_PATTERN = /^.+\s-\s(v[\w.+-]+)$/i;

function normalizeUpdateTitle(title: string): string {
  const match = title.trim().match(SUITE_TITLE_PREFIX_PATTERN);
  if (!match) {
    return title;
  }

  return match[1] ?? title;
}

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
    title: normalizeUpdateTitle(entry.frontmatter.title),
    description: entry.frontmatter.date,
  };
}
