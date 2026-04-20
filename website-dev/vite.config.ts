import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkDirective from "remark-directive";
import { remarkHeadingIds } from "./app/features/docs/mdx/remark-heading-ids.ts";
import { remarkStripFrontmatter } from "./app/features/docs/mdx/remark-strip-frontmatter.ts";
import { remarkAdmonitionDirectives } from "./app/features/docs/mdx/remark-admonitions.ts";
import { defineConfig } from "vite-plus";
import type { Plugin } from "vite-plus";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VIRTUAL_RAW_MDX_ID = "virtual:mdx-raw-content";
const RESOLVED_VIRTUAL_RAW_MDX_ID = "\0" + VIRTUAL_RAW_MDX_ID;

/**
 * Vite plugin that exposes validated raw MDX source and parsed frontmatter
 * through a virtual module for runtime docs tree construction.
 */
function mdxRawContentPlugin(): Plugin {
  const contentDir = path.join(__dirname, "content", "docs");
  return {
    name: "mdx-raw-content",
    async buildStart() {
      const { assertDocsContentValid } = await import("./app/config/docs/content-validation.ts");
      assertDocsContentValid(contentDir);
    },
    resolveId(id) {
      if (id === VIRTUAL_RAW_MDX_ID) return RESOLVED_VIRTUAL_RAW_MDX_ID;
    },
    async load(id) {
      if (id !== RESOLVED_VIRTUAL_RAW_MDX_ID) return;

      const { collectDocsContent } = await import("./app/config/docs/content-validation.ts");
      const { rawByPath, frontmatterByPath, errors } = collectDocsContent(contentDir);
      if (errors.length > 0) {
        const details = errors.map((e) => ` - ${e}`).join("\n");
        throw new Error(`[docs-content] Validation failed:\n${details}`);
      }

      return `export default ${JSON.stringify({ rawByPath, frontmatterByPath })};`;
    },
  };
}

/**
 * Strips static heading ID syntax `{#some-id}` from MDX content before compilation.
 * MDX interprets `{...}` as JSX expressions, causing parse errors.
 * The IDs are preserved in raw content (via mdxRawContentPlugin) for extractHeadings(),
 * and slugify() in the heading component produces matching IDs.
 */
const HEADING_ID_RE = /^(#{2,4}\s+.+?)\s+\{#[A-Za-z0-9._-]+\}\s*$/gm;

function stripHeadingIds(code: string): string {
  if (!code.includes("{#")) return code;
  return code.replace(HEADING_ID_RE, "$1");
}

/**
 * Wraps the @mdx-js/rollup plugin to strip {#id} from headings before MDX parsing.
 * Uses a load hook to intercept MDX file content before @mdx-js/rollup's transform.
 * This works because Rollup's load hook provides the source code that transform receives.
 */
function mdxHeadingIdStripPlugin(): Plugin {
  return {
    name: "mdx-heading-id-strip",
    load(id) {
      if (typeof id !== "string" || !id.endsWith(".mdx")) return;
      if (id.startsWith("\0")) return;
      try {
        const content = fs.readFileSync(id, "utf-8");
        return stripHeadingIds(content);
      } catch {
        return;
      }
    },
  };
}

export default defineConfig({
  build: {
    outDir: "build/client",
  },
  lint: {
    ignorePatterns: ["node_modules/**", "build/**", "coverage/**", "dist/**"],
    // tsgolint currently fails on this Windows workspace path; keep linting stable
    // and run TypeScript checks via a dedicated `pnpm run typecheck` script.
    options: {
      typeAware: false,
      typeCheck: false,
    },
  },
  fmt: {
    ignorePatterns: ["node_modules/**", "build/**", "coverage/**"],
  },
  plugins: [
    mdxRawContentPlugin(),
    mdxHeadingIdStripPlugin(),
    tailwindcss(),
    mdx({
      remarkPlugins: [
        remarkFrontmatter,
        remarkStripFrontmatter,
        remarkHeadingIds,
        remarkGfm,
        remarkDirective,
        remarkAdmonitionDirectives,
      ],
    }),
  ],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, ".") },
      {
        find: /^@subway-builder-modded\/(.+)$/,
        replacement: path.resolve(__dirname, "../packages/$1/src/index.ts"),
      },
    ],
  },
  optimizeDeps: {
    exclude: [
      "@subway-builder-modded/shared-ui",
      "@subway-builder-modded/asset-listings-ui",
      "@subway-builder-modded/stores-core",
      "@subway-builder-modded/asset-listings-state",
      "@subway-builder-modded/lifecycle-core",
      "@subway-builder-modded/lifecycle-web",
      "@subway-builder-modded/config",
    ],
  },
});
