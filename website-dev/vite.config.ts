import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkDirective from "remark-directive";
import rehypePrettyCode from "rehype-pretty-code";
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
  const contentDir = path.join(__dirname, "content");
  return {
    name: "mdx-raw-content",
    async buildStart() {
      const { assertDocsContentValid } = await import("./src/config/docs/content-validation.ts");
      const { assertUpdatesContentValid } =
        await import("./src/config/updates/content-validation.ts");
      const { assertRegistryTemplatesContentValid } =
        await import("./src/config/registry/template-content-validation.ts");
      assertDocsContentValid(contentDir);
      assertUpdatesContentValid(contentDir);
      assertRegistryTemplatesContentValid(contentDir);
    },
    configureServer(server) {
      // Re-assemble the virtual module whenever any content file changes so that
      // the dev server picks up new / edited MDX files without a manual restart.
      const watcher = server.watcher;
      watcher.add(contentDir);
      const invalidate = () => {
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_RAW_MDX_ID);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
        }
        server.hot.send({ type: "full-reload" });
      };
      const isContentMarkdownFile = (filePath: string) =>
        filePath.startsWith(contentDir) && /\.(md|mdx)$/i.test(filePath);
      watcher.on("add", (filePath: string) => {
        if (isContentMarkdownFile(filePath)) invalidate();
      });
      watcher.on("change", (filePath: string) => {
        if (isContentMarkdownFile(filePath)) invalidate();
      });
      watcher.on("unlink", (filePath: string) => {
        if (isContentMarkdownFile(filePath)) invalidate();
      });
    },
    resolveId(id) {
      if (id === VIRTUAL_RAW_MDX_ID) return RESOLVED_VIRTUAL_RAW_MDX_ID;
    },
    async load(id) {
      if (id !== RESOLVED_VIRTUAL_RAW_MDX_ID) return;

      const { collectDocsContent } = await import("./src/config/docs/content-validation.ts");
      const { collectUpdatesContent } = await import("./src/config/updates/content-validation.ts");
      const { collectRegistryTemplatesContent } =
        await import("./src/config/registry/template-content-validation.ts");

      const docsResult = collectDocsContent(contentDir);
      const updatesResult = collectUpdatesContent(contentDir);
      const templatesResult = collectRegistryTemplatesContent(contentDir);
      const errors = [...docsResult.errors, ...updatesResult.errors, ...templatesResult.errors];
      if (errors.length > 0) {
        const details = errors.map((e) => ` - ${e}`).join("\n");
        throw new Error(`[docs-content] Validation failed:\n${details}`);
      }

      const rawByPath = {
        ...docsResult.rawByPath,
        ...updatesResult.rawByPath,
        ...templatesResult.rawByPath,
      };
      const frontmatterByPath = {
        ...docsResult.frontmatterByPath,
        ...updatesResult.frontmatterByPath,
        ...templatesResult.frontmatterByPath,
      };

      return `export default ${JSON.stringify({ rawByPath, frontmatterByPath })};`;
    },
  };
}

/**
 * Escapes static heading ID braces `{#some-id}` so MDX's expression parser
 * does not try to evaluate them as JSX expressions. The HTML entities are
 * decoded back into `{#some-id}` text by remark/micromark, which is then
 * picked up by the `remarkHeadingIds` plugin to set the explicit heading id.
 */
const HEADING_ID_RE = /^(#{2,4}\s+.+?)\s+\{#([A-Za-z0-9._-]+)\}\s*$/gm;

function escapeHeadingIds(code: string): string {
  if (!code.includes("{#")) return code;
  return code.replace(
    HEADING_ID_RE,
    (_full, head: string, id: string) => `${head} &#x7B;#${id}&#x7D;`,
  );
}

/**
 * Wraps the @mdx-js/rollup plugin to escape `{#id}` from headings before MDX
 * parsing, so the explicit ID survives parsing as text and remarkHeadingIds
 * can extract it onto the rendered heading element.
 */
function mdxHeadingIdEscapePlugin(): Plugin {
  return {
    name: "mdx-heading-id-escape",
    load(id) {
      if (typeof id !== "string" || !id.endsWith(".mdx")) return;
      if (id.startsWith("\0")) return;
      try {
        const content = fs.readFileSync(id, "utf-8");
        return escapeHeadingIds(content);
      } catch {
        return;
      }
    },
  };
}

function toPluginList(plugin: unknown): Plugin[] {
  if (Array.isArray(plugin)) return plugin as Plugin[];
  return [plugin as Plugin];
}

export default defineConfig(async () => {
  // Dynamic imports for local TypeScript modules: static top-level imports of
  // project .ts files fail when vp lint loads this config via Node's synchronous
  // ESM linker (which does not resolve .ts extensions). Dynamic imports use
  // the async path where tsx can intercept and handle TypeScript resolution.
  const { remarkHeadingIds } = await import("./src/features/content/mdx/remark-heading-ids.ts");
  const { remarkStripFrontmatter } =
    await import("./src/features/content/mdx/remark-strip-frontmatter.ts");
  const { remarkAdmonitionDirectives } =
    await import("./src/features/content/mdx/remark-admonitions.ts");

  return {
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
      mdxHeadingIdEscapePlugin(),
      ...toPluginList(tailwindcss()),
      ...toPluginList(
        mdx({
          remarkPlugins: [
            remarkFrontmatter,
            remarkStripFrontmatter,
            remarkHeadingIds,
            remarkGfm,
            remarkDirective,
            remarkAdmonitionDirectives,
          ],
          rehypePlugins: [
            [
              rehypePrettyCode,
              {
                theme: {
                  dark: "github-dark",
                  light: "github-light-high-contrast",
                },
                keepBackground: false,
              },
            ],
          ],
        }),
      ),
    ],
    resolve: {
      alias: [
        { find: "@", replacement: path.resolve(__dirname, "./src") },
        {
          find: /^@subway-builder-modded\/(.+)$/,
          replacement: path.resolve(__dirname, "../packages/$1/src/index.ts"),
        },
      ],
    },
    optimizeDeps: {
      exclude: [
        "@subway-builder-modded/analytics",
        "@subway-builder-modded/shared-ui",
        "@subway-builder-modded/asset-listings-ui",
        "@subway-builder-modded/stores-core",
        "@subway-builder-modded/asset-listings-state",
        "@subway-builder-modded/lifecycle-core",
        "@subway-builder-modded/lifecycle-web",
        "@subway-builder-modded/config",
      ],
    },
  };
});
