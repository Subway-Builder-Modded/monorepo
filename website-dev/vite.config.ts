import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import remarkGfm from "remark-gfm";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    mdx({
      remarkPlugins: [remarkGfm],
    }),
    reactRouter(),
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
