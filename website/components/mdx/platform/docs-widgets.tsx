import type { MDXComponents } from 'mdx/types';
import { IconItem, IconList } from '@/components/mdx/icon-list';
import { Tabs, TabItem } from '@/components/mdx/mdx-tabs';
import {
  DocsCard,
  DocsCardGrid,
} from '@/features/docs/components/docs-home-cards';
import { RailyardTaggingRegions } from '@/features/docs/components/railyard/tagging-regions';
import { UpdateSection } from '@/features/updates/components/update-section';

export const mdxDocsWidgetComponents: MDXComponents = {
  Tabs,
  TabItem,
  DocsCardGrid,
  DocsCard,
  RailyardTaggingRegions,
  UpdateSection,
  IconList,
  IconItem,
};
