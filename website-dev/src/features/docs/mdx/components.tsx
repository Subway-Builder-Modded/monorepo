import { articleMdxComponents } from "@/features/content/mdx";
import { DocsDirectory } from "./directory";
import { RegionTags } from "./region-tags";
export const mdxComponents: Record<string, React.ComponentType<any>> = {
  ...articleMdxComponents,
  DocsDirectory: DocsDirectory as React.ComponentType<Record<string, unknown>>,
  Directory: DocsDirectory as React.ComponentType<Record<string, unknown>>,
  RegionTags: RegionTags as React.ComponentType<Record<string, unknown>>,
} as Record<string, React.ComponentType<any>>;
