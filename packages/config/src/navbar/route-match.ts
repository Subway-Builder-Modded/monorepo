import type { ActiveRouteMatchRule } from './types';

export function isRouteMatch(pathname: string, rule: ActiveRouteMatchRule): boolean {
  if (rule.kind === 'exact') {
    return pathname === rule.path;
  }

  return pathname === rule.path || pathname.startsWith(`${rule.path}/`);
}

export function isNavItemActive(
  pathname: string,
  rules: ActiveRouteMatchRule[] | undefined,
  href: string | undefined,
): boolean {
  if (rules?.length) {
    return rules.some((rule) => isRouteMatch(pathname, rule));
  }

  if (!href) {
    return false;
  }

  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
