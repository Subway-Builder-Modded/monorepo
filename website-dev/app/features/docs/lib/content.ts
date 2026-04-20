import type { DocsFrontmatter, DocsTreeNode, DocsTree } from "./types";
import type { DocsSidebarOrderItem, DocsSuiteId } from "@/app/features/docs/config";
import { getDocsSuiteConfig, getSidebarOrder, DOCS_CONTENT_ROOT } from "@/app/features/docs/config";
// @ts-expect-error -- virtual module provided by mdxRawContentPlugin in vite.config
import rawContentMap from "virtual:mdx-raw-content";

type RawMdxModule = {
  default: React.ComponentType;
};

type GlobResult = Record<string, () => Promise<RawMdxModule>>;

const mdxModules = import.meta.glob("/content/docs/**/*.mdx") as GlobResult;
const mdxRawModules: Record<string, string> = rawContentMap;

/**
 * Minimal browser-safe YAML frontmatter parser.
 * Handles simple key: value pairs from --- delimited blocks.
 * gray-matter uses Node.js Buffer which doesn't exist in browsers.
 */
function parseSimpleFrontmatter(raw: string): Record<string, string | boolean> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data: Record<string, string | boolean> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^(\w+)\s*:\s*(.+)/);
    if (!m) continue;
    const val = m[2].trim().replace(/^["']|["']$/g, "");
    if (val === "true") data[m[1]] = true;
    else if (val === "false") data[m[1]] = false;
    else data[m[1]] = val;
  }
  return data;
}

function parseFrontmatter(raw: string): DocsFrontmatter {
  const data = parseSimpleFrontmatter(raw);
  return {
    title: (data.title as string) ?? "Untitled",
    description: (data.description as string) ?? "",
    icon: (data.icon as string) ?? "FileText",
    hidden: data.hidden === true,
  };
}

function getContentKey(filePath: string): string {
  return filePath
    .replace(/^\/content\/docs\//, "")
    .replace(/\.mdx$/, "");
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
    if (!raw) continue;

    const key = getContentKey(filePath);
    try {
      const frontmatter = parseFrontmatter(raw);
      entries.push({ key, filePath, frontmatter, loader, raw });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const stack = e instanceof Error ? e.stack : "";
      throw new Error(`discoverContent failed on ${filePath}: ${msg}\n\nStack: ${stack}`);
    }
  }

  return entries;
}

function getEntriesForSuiteVersion(
  entries: ContentEntry[],
  suiteId: string,
  version: string,
): ContentEntry[] {
  const prefix = `${suiteId}/${version}/`;
  return entries.filter((e) => e.key.startsWith(prefix));
}

function buildTreeFromEntries(
  entries: ContentEntry[],
  suiteId: string,
  version: string,
  order: DocsSidebarOrderItem[],
): DocsTreeNode[] {
  const prefix = `${suiteId}/${version}/`;
  const basePath = `/${suiteId}/docs/${version}`;

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
      const childNodes = hasChildren
        ? buildNodes(children, slug, depth + 1)
        : [];

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

export function getDocsTree(suiteId: DocsSuiteId, version: string): DocsTree {
  const cacheKey = `${suiteId}:${version}`;
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

export function findTreeNode(
  tree: DocsTree,
  slug: string,
): DocsTreeNode | null {
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

export async function loadDocContent(
  sourcePath: string,
): Promise<React.ComponentType | null> {
  const loader = mdxModules[sourcePath];
  if (!loader) return null;

  const mod = await loader();
  return mod.default;
}

export function getDocRawContent(sourcePath: string): string | null {
  return mdxRawModules[sourcePath] ?? null;
}

export function getDocSourcePath(
  suiteId: string,
  version: string,
  slug: string,
): string {
  return `/${DOCS_CONTENT_ROOT}/${suiteId}/${version}/${slug}.mdx`;
}

export function getEditUrl(
  suiteId: DocsSuiteId,
  version: string,
  slug: string,
): string {
  const config = getDocsSuiteConfig(suiteId);
  if (!config) return "#";
  return `${config.editSourceBaseUrl}/${version}/${slug}.mdx`;
}

export function validateFolderLandingPages(
  suiteId: DocsSuiteId,
  version: string,
): string[] {
  const entries = getContentEntries();
  const prefix = `${suiteId}/${version}/`;
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
