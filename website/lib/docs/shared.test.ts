import { describe, expect, it } from 'vitest';
import { DOCS_INSTANCES } from '@/config/content/docs';
import {
  buildDocHref,
  buildVersionedDocHref,
  getActiveInstanceFromPathname,
  getActiveVersionFromPathname,
  getDocSlugFromPathname,
  resolveDocsRouteForInstance,
} from '@/lib/docs/shared';

const railyardDocs = DOCS_INSTANCES.find(
  (instance) => instance.id === 'railyard',
);
const templateModDocs = DOCS_INSTANCES.find(
  (instance) => instance.id === 'template-mod',
);

if (!railyardDocs || !templateModDocs) {
  throw new Error('Expected docs instances for tests were not found.');
}

describe('resolveDocsRouteForInstance', () => {
  it('resolves explicit version and document slug', () => {
    const route = resolveDocsRouteForInstance('railyard', [
      'v0.1',
      'players',
      'github-token',
    ]);

    expect(route).toEqual({
      instance: railyardDocs,
      version: 'v0.1',
      docSlug: 'players/github-token',
      requestedVersion: 'v0.1',
    });
  });

  it('maps latest alias to the latest version', () => {
    const route = resolveDocsRouteForInstance('railyard', [
      'latest',
      'players',
    ]);

    expect(route?.version).toBe('v0.2');
    expect(route?.docSlug).toBe('players');
    expect(route?.requestedVersion).toBe('latest');
  });

  it('treats unknown version as part of the slug and falls back to latest', () => {
    const route = resolveDocsRouteForInstance('railyard', [
      'v9.9',
      'players',
      'github-token',
    ]);

    expect(route?.version).toBe('v0.2');
    expect(route?.docSlug).toBe('v9.9/players/github-token');
    expect(route?.requestedVersion).toBe('v9.9');
  });
});

describe('pathname resolution helpers', () => {
  it('gets the active docs instance from pathname', () => {
    expect(
      getActiveInstanceFromPathname('/template-mod/docs/getting-started').id,
    ).toBe('template-mod');
    expect(getActiveInstanceFromPathname('/unknown')).toBe(DOCS_INSTANCES[0]);
  });

  it('gets active version with fallback to latest when missing', () => {
    expect(
      getActiveVersionFromPathname(railyardDocs, '/railyard/docs/v0.1/players')
        ?.value,
    ).toBe('v0.1');
    expect(
      getActiveVersionFromPathname(railyardDocs, '/railyard/docs/players')
        ?.value,
    ).toBe('v0.2');
  });

  it('extracts doc slug from versioned and non-versioned paths', () => {
    expect(
      getDocSlugFromPathname(
        railyardDocs,
        '/railyard/docs/v0.1/players/github-token',
      ),
    ).toBe('players/github-token');
    expect(
      getDocSlugFromPathname(
        templateModDocs,
        '/template-mod/docs/getting-started',
      ),
    ).toBe('getting-started');
  });
});

describe('docs href builders', () => {
  it('builds versioned and non-versioned doc hrefs', () => {
    expect(buildDocHref(railyardDocs, 'v0.2', 'players')).toBe(
      '/railyard/docs/v0.2/players',
    );
    expect(buildDocHref(templateModDocs, 'v1.0', 'getting-started')).toBe(
      '/template-mod/docs/v1.0/getting-started',
    );
  });

  it('rebuilds current pathname with the selected version', () => {
    expect(
      buildVersionedDocHref(
        railyardDocs,
        'v0.1',
        '/railyard/docs/v0.2/players/github-token',
      ),
    ).toBe('/railyard/docs/v0.1/players/github-token');
  });
});
