import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkDirective from "remark-directive";
import { remarkHeadingIds } from "./app/features/docs/mdx/remark-heading-ids";
import { remarkAdmonitionDirectives } from "./app/features/docs/mdx/remark-admonitions";
import { defineConfig } from "vite-plus";
import type { Plugin } from "vite-plus";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VIRTUAL_RAW_MDX_ID = "virtual:mdx-raw-content";
const RESOLVED_VIRTUAL_RAW_MDX_ID = "\0" + VIRTUAL_RAW_MDX_ID;

function findMdxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMdxFiles(fullPath));
    } else if (entry.name.endsWith(".mdx")) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Vite plugin that provides raw MDX file content as a virtual module.
 * This avoids using import.meta.glob with ?raw which conflicts with
 * @mdx-js/rollup (its createFilter strips query params before matching,
 * causing it to compile raw imports as React components).
 */
function mdxRawContentPlugin(): Plugin {
  const contentDir = path.join(__dirname, "content", "docs");
  return {
    name: "mdx-raw-content",
    resolveId(id) {
      if (id === VIRTUAL_RAW_MDX_ID) return RESOLVED_VIRTUAL_RAW_MDX_ID;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_RAW_MDX_ID) return;

      const files = findMdxFiles(contentDir);
      const content: Record<string, string> = {};
      for (const file of files) {
        const relPath = "/" + path.relative(__dirname, file).replace(/\\/g, "/");
        content[relPath] = fs.readFileSync(file, "utf-8");
      }
      return `export default ${JSON.stringify(content)};`;
    },
  };
}

/**
 * Strips static heading ID syntax `{#some-id}` from MDX content before compilation.
 * MDX interprets `{...}` as JSX expressions, causing parse errors.
 * The IDs are preserved in raw content (via mdxRawContentPlugin) for extractHeadings(),
 * and slugify() in the heading component produces matching IDs.
 */
const HEADING_ID_RE = /^(#{2,4}\s+.+?)\s+\{#[a-z0-9][a-z0-9-]*\}\s*$/gm;

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
