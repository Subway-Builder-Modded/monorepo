import {
  getUpdatesSuiteConfig,
  UPDATES_DEFAULT_HOMEPAGE_DESCRIPTION,
  UPDATES_HOMEPAGE_ICON,
  UPDATES_HOMEPAGE_TITLE,
  type UpdatesSuiteId,
} from "@/config/updates";
import { getSuiteById } from "@/config/site-navigation";
import type { UpdateEntry } from "./types";

export function getUpdatesHomepageDescription(suiteId: UpdatesSuiteId): string {
  const suiteConfig = getUpdatesSuiteConfig(suiteId);
  if (suiteConfig?.homepage.description?.trim()) {
    return suiteConfig.homepage.description.trim();
  }

  const suite = getSuiteById(suiteId);
  return `Changelogs and release notes for ${suite.title}.`;
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