import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import { compileMDX } from 'next-mdx-remote/rsc';
import { remarkHeadingId } from 'remark-custom-heading-id';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkDirective from 'remark-directive';
import remarkFlexibleCodeTitles from 'remark-flexible-code-titles';
import remarkAdmonitionDirectives from '@/lib/remark-admonition-directives';

import {
  DOCS_INSTANCES,
  getSidebarOrder,
  type DocsInstance,
} from '@/config/content/docs';
import {
  buildDocsHubHref,
  buildDocHref,
  resolveDocsRoute,
  type DocsSidebarCategory,
  type DocsSidebarEntry,
  type DocsSidebarPage,
  type DocsSidebarTree,
} from '@/lib/docs/shared';

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'docs');

export type DocsFrontmatter = {
  title: string;
  description?: string;
};

export type DocsBreadcrumbItem = {
  label: string;
  href?: string;
};

export type DocsTocHeading = {
  id: string;
  text: string;
  level: number;
};

function exists(filePath: string) {
  return fs.existsSync(filePath);
}

function humanizeSegment(segment: string) {
  return segment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const CUSTOM_HEADING_ID_PATTERN = /\s*\{#([^\s}]+)\}\s*$/;

function getInstanceContentDir(instance: DocsInstance, version: string | null) {
  return instance.versioned
    ? path.join(CONTENT_ROOT, instance.id, version ?? '')
    : path.join(CONTENT_ROOT, instance.id);
}

async function readSource(filePath: string) {
  return fs.promises.readFile(filePath, 'utf8');
}

async function readFrontmatter(filePath: string) {
  const source = await readSource(filePath);
  const { frontmatter } = await compileMDX<DocsFrontmatter>({
    source,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [
          remarkGfm,
          remarkHeadingId,
          remarkFlexibleCodeTitles,
          remarkDirective,
          remarkAdmonitionDirectives,
        ],
        rehypePlugins: [
          [
            rehypePrettyCode,
            {
              theme: {
                dark: 'github-dark',
                light: 'github-light-high-contrast',
              },
              keepBackground: false,
            },
          ],
          [
            rehypeExternalLinks,
            {
              target: '_blank',
              rel: ['nofollow', 'noopener', 'noreferrer'],
            },
          ],
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'append',
              properties: {
                className: ['heading-anchor'],
                ariaLabel: 'Link to section',
              },
            },
          ],
        ],
      },
    },
  });
  return frontmatter;
}

export async function extractTocHeadings(
  filePath: string,
): Promise<DocsTocHeading[]> {
  const source = await readSource(filePath);
  const lines = source.split('\n');
  const headings: DocsTocHeading[] = [];
  let inCodeFence = false;

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inCodeFence = !inCodeFence;
      continue;
    }

    if (inCodeFence) continue;

    const match = /^(#{2,4})\s+(.*)$/.exec(line.trim());
    if (!match) continue;

    const level = match[1].length;
    const rawText = match[2].trim();
    const customIdMatch = rawText.match(CUSTOM_HEADING_ID_PATTERN);

    const text = rawText.replace(CUSTOM_HEADING_ID_PATTERN, '').trim();
    const id = customIdMatch ? customIdMatch[1] : slugify(text);

    headings.push({
      id,
      text,
      level,
    });
  }

  return headings;
}

function getOrderItemKey(item: string | { key: string }) {
  return typeof item === 'string' ? item : item.key;
}

function getOrderChildren(
  order: ReturnType<typeof getSidebarOrder>,
  localKey: string,
) {
  const match = order.find((item) => getOrderItemKey(item) === localKey);
  return typeof match === 'string' ? undefined : match?.children;
}

function getLocalEntryKey(entry: DocsSidebarEntry) {
  const parts = entry.key.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? entry.key;
}

function sortEntriesWithOrder(
  entries: DocsSidebarEntry[],
  order: ReturnType<typeof getSidebarOrder>,
) {
  const orderMap = new Map<string, number>();

  order.forEach((item, index) => {
    orderMap.set(getOrderItemKey(item), index);
  });

  return [...entries].sort((a, b) => {
    const aLocalKey = getLocalEntryKey(a);
    const bLocalKey = getLocalEntryKey(b);

    const aPos = orderMap.get(aLocalKey) ?? Infinity;
    const bPos = orderMap.get(bLocalKey) ?? Infinity;

    if (aPos !== bPos) return aPos - bPos;

    return a.title.localeCompare(b.title);
  });
}

function getCategoryPageFile(parentDir: string, categoryName: string) {
  const folderIndex = path.join(parentDir, categoryName, 'index.mdx');
  const siblingFile = path.join(parentDir, `${categoryName}.mdx`);

  if (exists(folderIndex)) return folderIndex;
  if (exists(siblingFile)) return siblingFile;
  return null;
}

async function readTitleForPath(baseDir: string, relativePath: string) {
  const directFile = path.join(baseDir, `${relativePath}.mdx`);
  const directIndex = path.join(baseDir, relativePath, 'index.mdx');

  if (exists(directFile)) {
    const frontmatter = await readFrontmatter(directFile);
    return frontmatter?.title;
  }

  if (exists(directIndex)) {
    const frontmatter = await readFrontmatter(directIndex);
    return frontmatter?.title;
  }

  return undefined;
}

async function buildCategoryEntry(
  parentDir: string,
  categoryName: string,
  pathSegments: string[],
  instance: DocsInstance,
  version: string | null,
  order: ReturnType<typeof getSidebarOrder>,
): Promise<DocsSidebarCategory | null> {
  const dirPath = path.join(parentDir, categoryName);
  if (!exists(dirPath)) return null;

  const categoryPageFile = getCategoryPageFile(parentDir, categoryName);
  const categoryFrontmatter = categoryPageFile
    ? await readFrontmatter(categoryPageFile)
    : undefined;

  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  const dirNames = new Set(
    entries.filter((e) => e.isDirectory()).map((e) => e.name),
  );
  const items: DocsSidebarEntry[] = [];
  const localOrder = getOrderChildren(order, categoryName) ?? [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const childCategory = await buildCategoryEntry(
        dirPath,
        entry.name,
        [...pathSegments, entry.name],
        instance,
        version,
        localOrder,
      );
      if (childCategory) items.push(childCategory);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.mdx')) continue;

    const basename = entry.name.replace(/\.mdx$/, '');

    if (basename === 'index') continue;
    if (dirNames.has(basename)) continue;

    const relPath = [...pathSegments, basename].join('/');
    const frontmatter = await readFrontmatter(path.join(dirPath, entry.name));

    items.push({
      kind: 'page',
      key: relPath,
      title: frontmatter?.title ?? humanizeSegment(basename),
      href: buildDocHref(instance, version, relPath),
    } satisfies DocsSidebarPage);
  }

  const sortedItems = sortEntriesWithOrder(items, localOrder);

  if (!categoryPageFile && sortedItems.length === 0) return null;

  const relPath = pathSegments.join('/');

  return {
    kind: 'category',
    key: relPath,
    title: categoryFrontmatter?.title ?? humanizeSegment(categoryName),
    href: categoryPageFile
      ? buildDocHref(instance, version, relPath)
      : undefined,
    items: sortedItems,
  };
}

export async function getSidebarTree(
  instance: DocsInstance,
  version: string | null,
): Promise<DocsSidebarTree> {
  const dir = getInstanceContentDir(instance, version);
  if (!exists(dir)) return { entries: [] };

  const order = getSidebarOrder(instance, version);
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const dirNames = new Set(
    entries.filter((e) => e.isDirectory()).map((e) => e.name),
  );
  const treeEntries: DocsSidebarEntry[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const category = await buildCategoryEntry(
        dir,
        entry.name,
        [entry.name],
        instance,
        version,
        order,
      );
      if (category) treeEntries.push(category);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.mdx')) continue;

    const basename = entry.name.replace(/\.mdx$/, '');

    if (dirNames.has(basename)) continue;

    const frontmatter = await readFrontmatter(path.join(dir, entry.name));

    const docPath = basename;
    const key = basename;

    treeEntries.push({
      kind: 'page',
      key,
      title: frontmatter?.title ?? humanizeSegment(basename),
      href: buildDocHref(instance, version, docPath),
    } satisfies DocsSidebarPage);
  }

  return {
    entries: sortEntriesWithOrder(treeEntries, order),
  };
}

export async function resolveDocsDocFilePath(slug?: string[]) {
  const resolved = resolveDocsRoute(slug);
  if (!resolved) return null;

  const dir = getInstanceContentDir(resolved.instance, resolved.version);
  if (!resolved.docSlug) return null;

  const directFile = path.join(dir, `${resolved.docSlug}.mdx`);
  const categoryIndex = path.join(dir, resolved.docSlug, 'index.mdx');

  if (exists(directFile)) return directFile;
  if (exists(categoryIndex)) return categoryIndex;

  return null;
}

export async function getDocsBreadcrumbs(
  slug?: string[],
): Promise<DocsBreadcrumbItem[]> {
  const resolved = resolveDocsRoute(slug);
  if (!resolved) return [{ label: 'Docs' }];

  const items: DocsBreadcrumbItem[] = [
    {
      label: `${resolved.instance.label} Docs`,
      href: buildDocsHubHref(resolved.instance),
    },
  ];

  if (!resolved.docSlug) return items;

  const dir = getInstanceContentDir(resolved.instance, resolved.version);
  const segments = resolved.docSlug.split('/').filter(Boolean);

  for (let i = 0; i < segments.length; i++) {
    const prefix = segments.slice(0, i + 1).join('/');
    const title =
      (await readTitleForPath(dir, prefix)) ?? humanizeSegment(segments[i]);

    items.push({
      label: title,
      href:
        i === segments.length - 1
          ? undefined
          : buildDocHref(resolved.instance, resolved.version, prefix),
    });
  }

  return items;
}

export async function getDocsDocTitle(slug?: string[]) {
  const filePath = await resolveDocsDocFilePath(slug);
  if (!filePath) return null;

  const frontmatter = await readFrontmatter(filePath);
  return frontmatter?.title ?? null;
}

export async function getDocsDocFrontmatter(slug?: string[]) {
  const filePath = await resolveDocsDocFilePath(slug);
  if (!filePath) return null;

  return readFrontmatter(filePath);
}

export async function getAllDocsDocSlugs(): Promise<string[][]> {
  const allSlugs: string[][] = [];

  async function collectMdxPaths(dir: string, prefix: string[] = []) {
    if (!exists(dir)) return;

    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await collectMdxPaths(fullPath, [...prefix, entry.name]);
        continue;
      }

      if (!entry.isFile() || !entry.name.endsWith('.mdx')) continue;

      const basename = entry.name.replace(/\.mdx$/, '');

      if (basename === 'index') {
        if (prefix.length > 0) {
          allSlugs.push(prefix);
        }
      } else {
        allSlugs.push([...prefix, basename]);
      }
    }
  }

  for (const instance of DOCS_INSTANCES) {
    if (instance.versioned) {
      for (const version of instance.versions ?? []) {
        const baseDir = path.join(CONTENT_ROOT, instance.id, version.value);
        await collectMdxPaths(baseDir, [instance.id, version.value]);
      }
    } else {
      const baseDir = path.join(CONTENT_ROOT, instance.id);
      await collectMdxPaths(baseDir, [instance.id]);
    }
  }

  return allSlugs;
}
