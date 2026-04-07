import type { MDXComponents } from 'mdx/types';
import {
  Admonition,
  Announcement,
  Bug as BugAdmonition,
  Caution,
  Danger,
  Deprecated,
  Example,
  Important,
  Info,
  Note,
  Success,
  Tip,
  Warning,
} from '@/components/ui/admonition';

export const mdxAdmonitionComponents: MDXComponents = {
  Admonition,
  Note,
  Tip,
  Important,
  Warning,
  Caution,
  Danger,
  Info,
  Success,
  Deprecated,
  BugAdmonition,
  Example,
  Announcement,
};
