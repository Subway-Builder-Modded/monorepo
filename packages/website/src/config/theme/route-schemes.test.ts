import { describe, expect, it } from 'vitest';
import {
  resolveSiteColorScheme,
  SITE_COLOR_SCHEME_ROUTE_RULES,
} from '@/config/theme/route-schemes';

describe('resolveSiteColorScheme', () => {
  it('resolves project schemes for matching paths', () => {
    expect(resolveSiteColorScheme('/railyard')).toBe('railyard');
    expect(resolveSiteColorScheme('/railyard/docs')).toBe('railyard');
    expect(resolveSiteColorScheme('/template-mod')).toBe('template-mod');
    expect(resolveSiteColorScheme('/template-mod/updates/v1.0.0')).toBe(
      'template-mod',
    );
    expect(resolveSiteColorScheme('/registry')).toBe('registry');
    expect(resolveSiteColorScheme('/registry/author/someone')).toBe('registry');
    expect(resolveSiteColorScheme('/website')).toBe('website');
    expect(resolveSiteColorScheme('/website/trending')).toBe('website');
    expect(resolveSiteColorScheme('/tools')).toBe('tools');
    expect(resolveSiteColorScheme('/tools/md-playground')).toBe('tools');
  });

  it('normalizes missing leading slash and trailing slash', () => {
    expect(resolveSiteColorScheme('railyard/docs')).toBe('railyard');
    expect(resolveSiteColorScheme('/railyard/')).toBe('railyard');
  });

  it('falls back to default for non-matching routes', () => {
    expect(resolveSiteColorScheme('/')).toBe('default');
    expect(resolveSiteColorScheme('/docs')).toBe('default');
    expect(resolveSiteColorScheme('/docs/registry')).toBe('default');
  });

  it('keeps route scheme rules discoverable in config order', () => {
    expect(SITE_COLOR_SCHEME_ROUTE_RULES).toEqual([
      { pattern: '/railyard/**', scheme: 'railyard' },
      { pattern: '/template-mod/**', scheme: 'template-mod' },
      { pattern: '/registry/**', scheme: 'registry' },
      { pattern: '/registry', scheme: 'registry' },
      { pattern: '/website/**', scheme: 'website' },
      { pattern: '/website', scheme: 'website' },
      { pattern: '/tools/**', scheme: 'tools' },
      { pattern: '/tools', scheme: 'tools' },
    ]);
  });
});
