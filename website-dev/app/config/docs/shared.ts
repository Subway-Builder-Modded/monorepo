import { BookText, type LucideIcon } from "lucide-react";

export const DOCS_GITHUB_BASE_URL =
  "https://github.com/Subway-Builder-Modded/monorepo/edit/website-dev/website";

export const DOCS_CONTENT_ROOT = "content/docs";

/**
 * Shared identity for the docs system. The docs homepage hero, page-metadata
 * resolver, and any other surface that names the docs section all source the
 * label and icon from here so the system speaks with one voice. Suite-specific
 * branding (suite title + suite icon) lives in `site-navigation`.
 */
export const DOCS_HOMEPAGE_TITLE = "Documentation";
export const DOCS_HOMEPAGE_ICON: LucideIcon = BookText;
