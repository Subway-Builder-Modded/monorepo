import { BookText, type LucideIcon } from "lucide-react";
import { CONTENT_GITHUB_EDIT_BASE_URL, CONTENT_ROOT } from "../shared/content";

/**
 * Re-exported under the docs-prefixed names that suite configs already import.
 * The actual values live in config/shared/content so the monorepo path is
 * declared exactly once across docs and updates.
 */
export const DOCS_GITHUB_BASE_URL = CONTENT_GITHUB_EDIT_BASE_URL;
export const DOCS_CONTENT_ROOT = CONTENT_ROOT;

/**
 * Shared identity for the docs system. The docs homepage hero, page-metadata
 * resolver, and any other surface that names the docs section all source the
 * label and icon from here so the system speaks with one voice. Suite-specific
 * branding (suite title + suite icon) lives in `site-navigation`.
 */
export const DOCS_HOMEPAGE_TITLE = "Documentation";
export const DOCS_HOMEPAGE_ICON: LucideIcon = BookText;
