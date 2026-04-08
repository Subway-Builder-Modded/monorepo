import type { CSSProperties } from 'react';
import type {
  AppNavbarDropdownItem,
  AppNavbarItem,
  NavbarColorScheme,
  NavbarColorSchemeId,
} from '@/config/navigation/navbar';
import { APP_NAVBAR_COLOR_SCHEMES } from '@/config/navigation/navbar';

export const NAVBAR_DEFAULT_COLOR_SCHEME_ID = 'default';

export const ITEM_SCHEME_VARIABLE_CLASS_NAME =
  '[--nav-hover-fg:var(--nav-hover-fg-light)] [--nav-hover-bg:var(--nav-hover-bg-light)] dark:[--nav-hover-fg:var(--nav-hover-fg-dark)] dark:[--nav-hover-bg:var(--nav-hover-bg-dark)] [--nav-active-fg:var(--nav-active-fg-light)] [--nav-active-bg:var(--nav-active-bg-light)] dark:[--nav-active-fg:var(--nav-active-fg-dark)] dark:[--nav-active-bg:var(--nav-active-bg-dark)] [--nav-indicator:var(--nav-indicator-light)] dark:[--nav-indicator:var(--nav-indicator-dark)]';

export function resolveNavbarScheme(
  schemeId?: NavbarColorSchemeId,
): NavbarColorScheme | null {
  if (!schemeId) return null;
  return APP_NAVBAR_COLOR_SCHEMES[schemeId] ?? null;
}

export function toSchemeStyle(
  scheme: NavbarColorScheme | null,
): CSSProperties | undefined {
  if (!scheme) return undefined;

  const hover = scheme.hover;
  const active = scheme.active ?? scheme.hover;
  const indicator = scheme.indicator;
  const style: Record<string, string> = {};

  if (hover) {
    style['--nav-hover-fg-light'] = hover.light.text;
    style['--nav-hover-bg-light'] = hover.light.background;
    style['--nav-hover-fg-dark'] = hover.dark.text;
    style['--nav-hover-bg-dark'] = hover.dark.background;
  }

  if (active) {
    style['--nav-active-fg-light'] = active.light.text;
    style['--nav-active-bg-light'] = active.light.background;
    style['--nav-active-fg-dark'] = active.dark.text;
    style['--nav-active-bg-dark'] = active.dark.background;
  }

  if (indicator) {
    style['--nav-indicator-light'] = indicator.light;
    style['--nav-indicator-dark'] = indicator.dark;
  } else if (active) {
    style['--nav-indicator-light'] = active.light.text;
    style['--nav-indicator-dark'] = active.dark.text;
  }

  return style as CSSProperties;
}

export function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function defaultItemHref(item: AppNavbarItem) {
  return item.href ?? (item.id ? `/${item.id}` : undefined);
}

export function getDropdownItemActiveDepth(
  pathname: string,
  item: AppNavbarDropdownItem,
): number {
  const paths = [item.href, ...(item.activeMatchPaths ?? [])].filter(
    (value): value is string => Boolean(value),
  );

  let best = -1;
  for (const path of paths) {
    if (!isActivePath(pathname, path)) continue;
    const depth = path.split('/').filter(Boolean).length;
    if (depth > best) {
      best = depth;
    }
  }

  return best;
}
