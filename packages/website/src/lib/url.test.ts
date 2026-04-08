import { describe, expect, it } from 'vitest';
import { isExternalHref, normalizePath } from '@/lib/url';

describe('isExternalHref', () => {
  it('returns true only for absolute http or https URLs', () => {
    expect(isExternalHref('https://example.com')).toBe(true);
    expect(isExternalHref('http://example.com')).toBe(true);
    expect(isExternalHref('/docs')).toBe(false);
    expect(isExternalHref('mailto:test@example.com')).toBe(false);
    expect(isExternalHref('//example.com')).toBe(false);
    expect(isExternalHref(undefined)).toBe(false);
    expect(isExternalHref(null)).toBe(false);
  });
});

describe('normalizePath', () => {
  it('removes trailing slashes while preserving root', () => {
    expect(normalizePath('/')).toBe('/');
    expect(normalizePath('/docs/')).toBe('/docs');
    expect(normalizePath('/docs//')).toBe('/docs');
  });

  it('keeps paths without trailing slashes unchanged', () => {
    expect(normalizePath('/railyard/docs')).toBe('/railyard/docs');
    expect(normalizePath('relative/path')).toBe('relative/path');
  });
});
