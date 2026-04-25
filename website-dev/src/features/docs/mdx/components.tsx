import { articleMdxComponents } from "@/features/content/mdx";
import { DocsDirectory } from "./directory";
import { RegionTags } from "./region-tags";
// MDX component map requires a string-keyed record per the MDX runtime API.
// The `any` cast is an intentional boundary — prop types are enforced per-component in their own files.
export const mdxComponents: Record<string, React.ComponentType<any>> = {
  ...articleMdxComponents,
  DocsDirectory: DocsDirectory as React.ComponentType<Record<string, unknown>>,
  Directory: DocsDirectory as React.ComponentType<Record<string, unknown>>,
  RegionTags: RegionTags as React.ComponentType<Record<string, unknown>>,
} as Record<string, React.ComponentType<any>>;
