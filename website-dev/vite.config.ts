import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import remarkGfm from "remark-gfm";
import { defineConfig } from "vite-plus";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
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
    tailwindcss(),
    mdx({
      remarkPlugins: [remarkGfm],
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
