import type { SiteColorSchemeId } from '@/config/theme/contracts';

export type SiteColorSchemeRouteRule = {
  pattern: string;
  scheme: SiteColorSchemeId;
};

export const SITE_COLOR_SCHEME_ROUTE_RULES: SiteColorSchemeRouteRule[] = [
  { pattern: '/railyard/**', scheme: 'railyard' },
  { pattern: '/template-mod/**', scheme: 'template-mod' },
  { pattern: '/registry/**', scheme: 'registry' },
  { pattern: '/registry', scheme: 'registry' },
  { pattern: '/website/**', scheme: 'website' },
  { pattern: '/website', scheme: 'website' },
  { pattern: '/tools/**', scheme: 'tools' },
  { pattern: '/tools', scheme: 'tools' },
];

function normalizePathname(pathname: string): string {
  if (!pathname) return '/';
  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (withLeadingSlash !== '/' && withLeadingSlash.endsWith('/')) {
    return withLeadingSlash.slice(0, -1);
  }
  return withLeadingSlash;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function patternToRegex(pattern: string) {
  const normalizedPattern = normalizePathname(pattern);
  const hasTrailingGlob = normalizedPattern.endsWith('/**');
  const escaped = escapeRegex(normalizedPattern);
  const wildcardAware = escaped
    .replace(/\\\*\\\*/g, '.*')
    .replace(/\\\*/g, '[^/]*');

  if (hasTrailingGlob) {
    const base = normalizedPattern.slice(0, -3);
    return new RegExp(`^${escapeRegex(base)}(?:/.*)?$`);
  }

  return new RegExp(`^${wildcardAware}$`);
}

const COMPILED_SCHEME_ROUTE_RULES = SITE_COLOR_SCHEME_ROUTE_RULES.map(
  (rule) => ({
    ...rule,
    regex: patternToRegex(rule.pattern),
  }),
);

export function resolveSiteColorScheme(pathname: string): SiteColorSchemeId {
  const normalizedPathname = normalizePathname(pathname);

  for (const rule of COMPILED_SCHEME_ROUTE_RULES) {
    if (rule.regex.test(normalizedPathname)) {
      return rule.scheme;
    }
  }

  return 'default';
}
