import { type DocsInstance, type DocsVersion } from '@/config/content/docs';
import {
  PROJECT_COLOR_SCHEMES,
  getModeHex,
  type ModeHex,
} from '@/config/theme/colors';
import { isLatestVersion, type DocsSidebarEntry } from '@/lib/docs/shared';
import { normalizePath } from '@/lib/url';

export const SWITCHER_ROW_HIGHLIGHT_ALPHA = 0.12;
export const SWITCHER_ROW_NEUTRAL_ALPHA = 0.06;
export const SWITCHER_ICON_CONTRAST_ALPHA = 0.08;
export const SIDEBAR_WIDTH_REM = 17;
export const MOBILE_BREAKPOINT = 768;
export const EDGE_GAP_PX = 24;
export const MOBILE_SIDEBAR_TOP_OFFSET =
  'calc(var(--app-navbar-offset, 5.5rem) - 1.5rem)';
export const SIDEBAR_TOTAL_OFFSET_REM = SIDEBAR_WIDTH_REM + 1.5;
export const SIDEBAR_COOKIE_NAME = 'sidebar_state';
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function withAlpha(color: string, alpha: number) {
  const normalized = color.trim();

  if (!normalized.startsWith('#')) {
    return color;
  }

  const hex = normalized.slice(1);
  const fullHex =
    hex.length === 3
      ? hex
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : hex.length === 6
        ? hex
        : null;

  if (!fullHex) {
    return color;
  }

  const r = Number.parseInt(fullHex.slice(0, 2), 16);
  const g = Number.parseInt(fullHex.slice(2, 4), 16);
  const b = Number.parseInt(fullHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getInstanceAccent(instance: DocsInstance, isDark: boolean) {
  return getModeHex(PROJECT_COLOR_SCHEMES[instance.id].accentColor, isDark);
}

export function getInstanceBadgeScheme(instance: DocsInstance) {
  const accent = PROJECT_COLOR_SCHEMES[instance.id].accentColor;

  return {
    border: {
      light: withAlpha(accent.light, 0.45),
      dark: withAlpha(accent.dark, 0.5),
    },
    background: {
      light: withAlpha(accent.light, 0.12),
      dark: withAlpha(accent.dark, 0.2),
    },
    text: accent,
  } satisfies {
    border: ModeHex;
    background: ModeHex;
    text: ModeHex;
  };
}

export function getNeutralInteractiveBackground(
  isDark: boolean,
  alpha: number,
) {
  return isDark ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
}

export function getSwitcherRowBackground({
  accent,
  isDark,
  latest,
  highlighted,
}: {
  accent: string;
  isDark: boolean;
  latest: boolean;
  highlighted: boolean;
}) {
  if (!highlighted) return undefined;

  return latest
    ? withAlpha(accent, SWITCHER_ROW_HIGHLIGHT_ALPHA)
    : getNeutralInteractiveBackground(isDark, SWITCHER_ROW_NEUTRAL_ALPHA);
}

export function getSwitcherIconBackground(
  accent: string,
  isDark: boolean,
  latest: boolean,
) {
  if (latest) {
    return withAlpha(
      accent,
      SWITCHER_ROW_HIGHLIGHT_ALPHA + SWITCHER_ICON_CONTRAST_ALPHA,
    );
  }

  return getNeutralInteractiveBackground(isDark, SWITCHER_ICON_CONTRAST_ALPHA);
}

export function entryIsSelfActive(
  entry: DocsSidebarEntry,
  pathname: string,
): boolean {
  if (entry.kind === 'page') {
    return normalizePath(pathname) === normalizePath(entry.href);
  }

  return !!entry.href && normalizePath(pathname) === normalizePath(entry.href);
}

export function entryHasActiveDescendant(
  entry: DocsSidebarEntry,
  pathname: string,
): boolean {
  if (entry.kind === 'page') {
    return normalizePath(pathname) === normalizePath(entry.href);
  }

  return entry.items.some((child) => {
    if (child.kind === 'page') {
      return normalizePath(pathname) === normalizePath(child.href);
    }

    return (
      entryIsSelfActive(child, pathname) ||
      entryHasActiveDescendant(child, pathname)
    );
  });
}

function collectCategoryKeys(entry: DocsSidebarEntry, out = new Set<string>()) {
  if (entry.kind !== 'category') return out;

  out.add(entry.key);

  for (const child of entry.items) {
    collectCategoryKeys(child, out);
  }

  return out;
}

export function removeCategoryBranch(
  entry: DocsSidebarEntry,
  openKeys: Set<string>,
) {
  const next = new Set(openKeys);
  const keysToRemove = collectCategoryKeys(entry);

  keysToRemove.forEach((key) => next.delete(key));
  return next;
}

export function collectActiveCategoryKeys(
  entries: DocsSidebarEntry[],
  pathname: string,
  out = new Set<string>(),
) {
  for (const entry of entries) {
    if (entry.kind !== 'category') continue;

    const selfActive = entryIsSelfActive(entry, pathname);
    const childActive = entry.items.some((child) =>
      child.kind === 'page'
        ? normalizePath(pathname) === normalizePath(child.href)
        : entryIsSelfActive(child, pathname) ||
          entryHasActiveDescendant(child, pathname),
    );

    if (selfActive || childActive) out.add(entry.key);

    collectActiveCategoryKeys(entry.items, pathname, out);
  }

  return out;
}

export function findActiveEntry(
  entries: DocsSidebarEntry[],
  pathname: string,
  openKeys: Set<string>,
): DocsSidebarEntry | null {
  const normalizedPathname = normalizePath(pathname);

  for (const entry of entries) {
    if (entry.kind === 'page') {
      if (normalizedPathname === normalizePath(entry.href)) return entry;
      continue;
    }

    const selfActive = entryIsSelfActive(entry, normalizedPathname);
    const descendantActive = entry.items.some((child) =>
      child.kind === 'page'
        ? normalizedPathname === normalizePath(child.href)
        : entryIsSelfActive(child, normalizedPathname) ||
          entryHasActiveDescendant(child, normalizedPathname),
    );

    if (!selfActive && !descendantActive) continue;

    if (openKeys.has(entry.key)) {
      const deeper = findActiveEntry(entry.items, normalizedPathname, openKeys);
      return deeper ?? entry;
    }

    return entry;
  }

  return null;
}

export function getSidebarDepthClassName(depth: number) {
  if (depth <= 0) return '';
  if (depth === 1) return 'pl-5';
  if (depth === 2) return 'pl-8';
  if (depth === 3) return 'pl-11';
  return 'pl-13';
}

export function getSidebarDepthTypographyClassName(depth: number) {
  if (depth <= 0) return 'font-semibold text-sm';
  return 'font-normal text-sm';
}

export function getSidebarDepthToneClassName() {
  return 'text-foreground';
}

export function parseSidebarOpenState(
  cookieValue: string | undefined,
): boolean | null {
  if (!cookieValue) return null;
  const normalized = cookieValue.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return null;
}

export function readSidebarOpenStateFromCookieString(cookieString: string) {
  const parts = cookieString.split(';').map((part) => part.trim());
  const match = parts.find((part) =>
    part.startsWith(`${SIDEBAR_COOKIE_NAME}=`),
  );
  if (!match) return null;

  const value = match.slice(SIDEBAR_COOKIE_NAME.length + 1);
  return parseSidebarOpenState(value);
}

export function buildVersionBadgeState(
  instance: DocsInstance,
  version: DocsVersion,
) {
  return {
    latest: isLatestVersion(instance, version.value),
    deprecated: !!version.deprecated,
  };
}
