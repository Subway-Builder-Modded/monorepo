import type { DocsFrontmatter as DocsFrontmatterConfig } from "@/config/docs";

export type DocsFrontmatter = DocsFrontmatterConfig;

export type DocsTreeNode = {
  kind: "page" | "landing";
  key: string;
  slug: string;
  routePath: string;
  sourcePath: string;
  frontmatter: DocsFrontmatter;
  suiteId: string;
  version: string | null;
  children: DocsTreeNode[];
  depth: number;
};

export type DocsTree = {
  suiteId: string;
  version: string | null;
  nodes: DocsTreeNode[];
};

export type DocsTocHeading = {
  id: string;
  text: string;
  level: number;
};

export type ResolvedDocsRoute = {
  suiteId: string;
  version: string | null;
  docSlug: string | null;
  isHomepage: boolean;
};
