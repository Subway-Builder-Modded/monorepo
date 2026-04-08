import { describe, expect, it } from 'vitest';
import type { DocsSidebarEntry } from '@/lib/docs/shared';
import {
  collectActiveCategoryKeys,
  findActiveEntry,
  readSidebarOpenStateFromCookieString,
  removeCategoryBranch,
} from '@/features/docs/components/docs-sidebar/helpers';

const TREE: DocsSidebarEntry[] = [
  {
    kind: 'category',
    key: 'players',
    title: 'Players',
    href: '/docs/players',
    items: [
      {
        kind: 'page',
        key: 'install',
        title: 'Install',
        href: '/docs/players/install',
      },
      {
        kind: 'category',
        key: 'advanced',
        title: 'Advanced',
        items: [
          {
            kind: 'page',
            key: 'tokens',
            title: 'Tokens',
            href: '/docs/players/tokens',
          },
        ],
      },
    ],
  },
];

describe('docs sidebar helpers', () => {
  it('collects active category keys for nested active routes', () => {
    expect(
      Array.from(collectActiveCategoryKeys(TREE, '/docs/players/tokens')),
    ).toEqual(['players', 'advanced']);
  });

  it('finds deepest active entry when branch is open', () => {
    const entry = findActiveEntry(
      TREE,
      '/docs/players/tokens',
      new Set(['players', 'advanced']),
    );
    expect(entry?.key).toBe('tokens');
  });

  it('removes an entire category branch from open state', () => {
    const next = removeCategoryBranch(
      TREE[0],
      new Set(['players', 'advanced']),
    );
    expect(Array.from(next)).toEqual([]);
  });

  it('parses sidebar open state cookie values', () => {
    expect(
      readSidebarOpenStateFromCookieString('foo=1; sidebar_state=false'),
    ).toBe(false);
    expect(
      readSidebarOpenStateFromCookieString('sidebar_state=true; foo=1'),
    ).toBe(true);
    expect(
      readSidebarOpenStateFromCookieString('sidebar_state=invalid'),
    ).toBeNull();
  });
});
