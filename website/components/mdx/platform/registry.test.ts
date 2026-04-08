import { describe, expect, it } from 'vitest';
import {
  mdxComponentGroups,
  useMDXComponents,
} from '@/components/mdx/platform/registry';

describe('mdx component registry', () => {
  it('exposes core and ergonomic icon components', () => {
    const registry = useMDXComponents();
    expect(typeof registry.a).toBe('function');
    expect(typeof registry.Icon).toBe('function');
    expect(typeof registry.SiteIcon).toBe('function');
    expect(typeof registry.IconList).toBe('function');
    expect(typeof registry.Tabs).toBe('function');
  });

  it('keeps public component groups explicit', () => {
    expect(typeof mdxComponentGroups.icons.Icon).toBe('function');
    expect(typeof mdxComponentGroups.docsWidgets.IconItem).toBe('function');
    expect(typeof mdxComponentGroups.core.h1).toBe('function');
  });
});
