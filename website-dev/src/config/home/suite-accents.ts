import { SITE_SUITES, type SiteSuiteAccent, type SiteSuiteId } from "@/config/site-navigation";
import type { HomeAccent } from "./types";

const SUITE_ACCENT_BY_ID = new Map<SiteSuiteId, SiteSuiteAccent>(
  SITE_SUITES.map((suite) => [suite.id, suite.accent]),
);

export function getHomepageSuiteAccent(suiteId: SiteSuiteId): HomeAccent {
  const accent = SUITE_ACCENT_BY_ID.get(suiteId);

  if (!accent) {
    throw new Error(`Missing homepage suite accent for ${suiteId}`);
  }

  return {
    light: accent.light,
    dark: accent.dark,
  };
}

const HERO_BAR_SUITE_IDS = ["railyard", "registry", "template-mod", "website", "depot"] as const;

export const HERO_SUITE_BARS = HERO_BAR_SUITE_IDS.map((suiteId) => getHomepageSuiteAccent(suiteId));
