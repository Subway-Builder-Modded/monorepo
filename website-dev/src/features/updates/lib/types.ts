import type { UpdatesFrontmatter, UpdatesSuiteId } from "@/config/updates";

export type UpdateEntry = {
  id: string;
  suiteId: UpdatesSuiteId;
  key: string;
  depth: number;
  sourcePath: string;
  routePath: string;
  frontmatter: UpdatesFrontmatter;
  loader: () => Promise<{ default: React.ComponentType }>;
  raw: string;
};

export type UpdateTreeNode = {
  key: string;
  id: string;
  suiteId: UpdatesSuiteId;
  depth: number;
  sourcePath: string;
  routePath: string;
  frontmatter: UpdatesFrontmatter;
};

export type UpdatesRouteMatch =
  | { kind: "none" }
  | { kind: "homepage"; suiteId: UpdatesSuiteId }
  | { kind: "update"; suiteId: UpdatesSuiteId; slug: string }
  | { kind: "not-found"; suiteId: UpdatesSuiteId; reason: string };
