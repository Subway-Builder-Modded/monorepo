import type { DocsTreeNode, DocsTree } from "./types";
import type { DocsFrontmatter, DocsRouteVersion, DocsSidebarOrderItem, DocsSuiteId } from "@/app/config/docs";
import { getDocsSuiteConfig, getSidebarOrder, DOCS_CONTENT_ROOT } from "@/app/config/docs";
// @ts-expect-error -- virtual module provided by mdxRawContentPlugin in vite.config
import rawContentData from "virtual:mdx-raw-content";

type RawMdxModule = {
  default: React.ComponentType;
};

type GlobResult = Record<string, () => Promise<RawMdxModule>>;
type RawContentVirtualModule = {
  rawByPath: Record<string, string>;
  frontmatterByPath: Record<string, DocsFrontmatter>;
};

const mdxModules = import.meta.glob("/content/docs/**/*.mdx") as GlobResult;
const mdxRawModules: Record<string, string> = (rawContentData as RawContentVirtualModule).rawByPath;
const mdxFrontmatterModules: Record<string, DocsFrontmatter> = (
  rawContentData as RawContentVirtualModule
).frontmatterByPath;

function getContentKey(filePath: string): string {
  return filePath.replace(/^\/content\/docs\//, "").replace(/\.mdx$/, "");
}

type ContentEntry = {
  key: string;
  filePath: string;
  frontmatter: DocsFrontmatter;
  loader: () => Promise<RawMdxModule>;
  raw: string;
};

function discoverContent(): ContentEntry[] {
  const entries: ContentEntry[] = [];

  for (const [filePath, loader] of Object.entries(mdxModules)) {
    const raw = mdxRawModules[filePath];
    const frontmatter = mdxFrontmatterModules[filePath];
    if (!raw || !frontmatter) continue;

    const key = getContentKey(filePath);
    entries.push({ key, filePath, frontmatter, loader, raw });
  }

  return entries;
}

function getEntriesForSuiteVersion(
  entries: ContentEntry[],
  suiteId: DocsSuiteId,
  version: DocsRouteVersion,
): ContentEntry[] {
  const suiteConfig = getDocsSuiteConfig(suiteId);
  if (!suiteConfig) return [];

  const prefix = suiteConfig.versioned ? `${suiteId}/${version}/` : `${suiteId}/`;

  return entries.filter((e) => e.key.startsWith(prefix));
}

function buildTreeFromEntries(
  entries: ContentEntry[],
  suiteId: DocsSuiteId,
  version: DocsRouteVersion,
  order: DocsSidebarOrderItem[],
): DocsTreeNode[] {
  const suiteConfig = getDocsSuiteConfig(suiteId);
  if (!suiteConfig) return [];

  const prefix = suiteConfig.versioned ? `${suiteId}/${version}/` : `${suiteId}/`;
  const basePath = suiteConfig.versioned ? `/${suiteId}/docs/${version}` : `/${suiteId}/docs`;

  const entryBySlug = new Map<string, ContentEntry>();
  for (const entry of entries) {
    const slug = entry.key.slice(prefix.length);
    entryBySlug.set(slug, entry);
  }

  function buildNodes(
    orderItems: DocsSidebarOrderItem[],
    parentSlug: string,
    depth: number,
  ): DocsTreeNode[] {
    const nodes: DocsTreeNode[] = [];

    for (const item of orderItems) {
      const key = typeof item === "string" ? item : item.key;
      const children = typeof item === "string" ? undefined : item.children;
      const slug = parentSlug ? `${parentSlug}/${key}` : key;

      const entry = entryBySlug.get(slug);
      if (!entry) continue;

      const hasChildren = children && children.length > 0;
      const childNodes = hasChildren ? buildNodes(children, slug, depth + 1) : [];

      nodes.push({
        kind: hasChildren ? "landing" : "page",
        key,
        slug,
        routePath: `${basePath}/${slug}`,
        sourcePath: entry.filePath,
        frontmatter: entry.frontmatter,
        suiteId,
        version,
        children: childNodes,
        depth,
      });
    }

    return nodes;
  }

  return buildNodes(order, "", 0);
}

const treeCache = new Map<string, DocsTree>();
let contentEntries: ContentEntry[] | null = null;

function getContentEntries(): ContentEntry[] {
  if (!contentEntries) {
    contentEntries = discoverContent();
  }
  return contentEntries;
}

export function getDocsTree(suiteId: DocsSuiteId, version: DocsRouteVersion): DocsTree {
  const cacheKey = `${suiteId}:${version ?? "__no_version__"}`;
  const cached = treeCache.get(cacheKey);
  if (cached) return cached;

  const entries = getContentEntries();
  const suiteEntries = getEntriesForSuiteVersion(entries, suiteId, version);
  const order = getSidebarOrder(suiteId, version);
  const nodes = buildTreeFromEntries(suiteEntries, suiteId, version, order);

  const tree: DocsTree = { suiteId, version, nodes };
  treeCache.set(cacheKey, tree);
  return tree;
}

export function findTreeNode(tree: DocsTree, slug: string): DocsTreeNode | null {
  function search(nodes: DocsTreeNode[]): DocsTreeNode | null {
    for (const node of nodes) {
      if (node.slug === slug) return node;
      const found = search(node.children);
      if (found) return found;
    }
    return null;
  }
  return search(tree.nodes);
}

export function getVisibleNodes(nodes: DocsTreeNode[]): DocsTreeNode[] {
  return nodes.filter((n) => !n.frontmatter.hidden);
}

export function getAllNodes(tree: DocsTree): DocsTreeNode[] {
  const result: DocsTreeNode[] = [];
  function collect(nodes: DocsTreeNode[]) {
    for (const node of nodes) {
      result.push(node);
      collect(node.children);
    }
  }
  collect(tree.nodes);
  return result;
}

export async function loadDocContent(sourcePath: string): Promise<React.ComponentType | null> {
  const loader = mdxModules[sourcePath];
  if (!loader) return null;

  const mod = await loader();
  return mod.default;
}

export function getDocRawContent(sourcePath: string): string | null {
  return mdxRawModules[sourcePath] ?? null;
}

export function getDocSourcePath(
  suiteId: DocsSuiteId,
  version: DocsRouteVersion,
  slug: string,
): string {
  const suiteConfig = getDocsSuiteConfig(suiteId);
  if (!suiteConfig) {
    return `/${DOCS_CONTENT_ROOT}/${suiteId}/${slug}.mdx`;
  }

  if (!suiteConfig.versioned) {
    return `/${DOCS_CONTENT_ROOT}/${suiteId}/${slug}.mdx`;
  }

  return `/${DOCS_CONTENT_ROOT}/${suiteId}/${version}/${slug}.mdx`;
}

export function getEditUrl(suiteId: DocsSuiteId, version: DocsRouteVersion, slug: string): string {
  const config = getDocsSuiteConfig(suiteId);
  if (!config) return "#";

  if (!config.versioned) {
    return `${config.editSourceBaseUrl}/${slug}.mdx`;
  }

  return `${config.editSourceBaseUrl}/${version}/${slug}.mdx`;
}

export function validateFolderLandingPages(
  suiteId: DocsSuiteId,
  version: DocsRouteVersion,
): string[] {
  const entries = getContentEntries();
  const suiteConfig = getDocsSuiteConfig(suiteId);
  if (!suiteConfig) return [];

  const prefix = suiteConfig.versioned ? `${suiteId}/${version}/` : `${suiteId}/`;
  const slugs = new Set<string>();
  const folders = new Set<string>();

  for (const entry of entries) {
    if (!entry.key.startsWith(prefix)) continue;
    const slug = entry.key.slice(prefix.length);
    slugs.add(slug);

    const parts = slug.split("/");
    if (parts.length > 1) {
      for (let i = 1; i < parts.length; i++) {
        folders.add(parts.slice(0, i).join("/"));
      }
    }
  }

  const missing: string[] = [];
  for (const folder of folders) {
    if (!slugs.has(folder)) {
      missing.push(folder);
    }
  }

  return missing;
}
