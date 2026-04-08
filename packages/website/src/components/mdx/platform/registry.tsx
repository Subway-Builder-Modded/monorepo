import type { MDXComponents } from 'mdx/types';
import { mdxAdmonitionComponents } from '@/components/mdx/platform/admonitions';
import { mdxCoreComponents } from '@/components/mdx/platform/core';
import { mdxDocsWidgetComponents } from '@/components/mdx/platform/docs-widgets';
import {
  mdxIconComponents,
  mdxLucideComponents,
} from '@/components/mdx/platform/icons';

export const mdxComponentGroups = {
  // Recommended author path for icons is <Icon name="..."/> / <SiteIcon name="..."/>.
  icons: {
    ...mdxIconComponents,
    ...mdxLucideComponents,
  } satisfies MDXComponents,
  admonitions: mdxAdmonitionComponents,
  docsWidgets: mdxDocsWidgetComponents,
  core: mdxCoreComponents,
} as const;

export const mdxComponentRegistry: MDXComponents = {
  ...mdxComponentGroups.icons,
  ...mdxComponentGroups.admonitions,
  ...mdxComponentGroups.docsWidgets,
  ...mdxComponentGroups.core,
};

export function useMDXComponents(
  components: MDXComponents = {},
): MDXComponents {
  return {
    ...mdxComponentRegistry,
    ...components,
  };
}
