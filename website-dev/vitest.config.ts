import path from "node:path";
import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "lib/**/*.ts",
        "config/**/*.ts",
        "components/**/*.ts",
        "components/**/*.tsx",
        "app/**/*.ts",
        "app/**/*.tsx",
      ],
      exclude: [
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.test.tsx",
        "app/root.tsx",
        "app/routes/**/*.tsx",
      ],
    },
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, ".") },
      {
        find: "virtual:mdx-raw-content",
        replacement: path.resolve(__dirname, "./tests/virtual-mdx-raw-content.ts"),
      },
      {
        find: /^@subway-builder-modded\/(.+)$/,
        replacement: path.resolve(__dirname, "../packages/$1/src/index.ts"),
      },
    ],
  },
});
