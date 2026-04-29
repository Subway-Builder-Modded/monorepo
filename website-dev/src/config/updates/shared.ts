import { Megaphone, type LucideIcon } from "lucide-react";
import type { UpdatesTag, UpdatesTagPresentation } from "./types";
import { CONTENT_GITHUB_EDIT_BASE_URL, CONTENT_ROOT } from "../shared/content";

export const UPDATES_GITHUB_BASE_URL = CONTENT_GITHUB_EDIT_BASE_URL;
export const UPDATES_CONTENT_ROOT = CONTENT_ROOT;

export const UPDATES_HOMEPAGE_TITLE = "Updates";
export const UPDATES_HOMEPAGE_ICON: LucideIcon = Megaphone;

export const UPDATES_DEFAULT_HOMEPAGE_DESCRIPTION =
  "Track releases, changelogs, and transit-line updates in one place.";

export const UPDATES_TAG_PRESENTATION: Record<UpdatesTag, UpdatesTagPresentation> = {
  release: {
    label: "Release",
    toneClassName: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  },
  beta: {
    label: "Beta",
    toneClassName: "bg-yellow-500/14 text-yellow-700 dark:text-yellow-300",
  },
  alpha: {
    label: "Release-Candidate",
    toneClassName: "bg-red-500/12 text-red-700 dark:text-red-300",
  },
};
