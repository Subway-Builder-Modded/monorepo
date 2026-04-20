export type DocsFrontmatter = {
  title: string;
  description: string;
  icon: string;
  hidden?: boolean;
};

export type DocsTreeNode = {
  kind: "page" | "landing";
  key: string;
  slug: string;
  routePath: string;
  sourcePath: string;
  frontmatter: DocsFrontmatter;
  suiteId: string;
  version: string;
  children: DocsTreeNode[];
  depth: number;
};

export type DocsTree = {
  suiteId: string;
  version: string;
  nodes: DocsTreeNode[];
};

export type DocsTocHeading = {
  id: string;
  text: string;
  level: number;
};

export type ResolvedDocsRoute = {
  suiteId: string;
  version: string;
  docSlug: string | null;
  isHomepage: boolean;
};
