import type { ActiveRouteMatchRule } from './types';

function normalizePathname(pathname: string): string {
  if (!pathname) {
    return '/';
  }

  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (withLeadingSlash !== '/' && withLeadingSlash.endsWith('/')) {
    return withLeadingSlash.slice(0, -1);
  }

  return withLeadingSlash;
}

export function isRouteMatch(pathname: string, rule: ActiveRouteMatchRule): boolean {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedRulePath = normalizePathname(rule.path);

  if (rule.kind === 'exact') {
    return normalizedPathname === normalizedRulePath;
  }

  return (
    normalizedPathname === normalizedRulePath ||
    normalizedPathname.startsWith(`${normalizedRulePath}/`)
  );
}

export function isNavItemActive(
  pathname: string,
  rules: ActiveRouteMatchRule[] | undefined,
  href: string | undefined,
): boolean {
  const normalizedPathname = normalizePathname(pathname);

  if (rules?.length) {
    return rules.some((rule) => isRouteMatch(normalizedPathname, rule));
  }

  if (!href) {
    return false;
  }

  const normalizedHref = normalizePathname(href);

  if (normalizedHref === '/') {
    return normalizedPathname === '/';
  }

  return (
    normalizedPathname === normalizedHref ||
    normalizedPathname.startsWith(`${normalizedHref}/`)
  );
}
