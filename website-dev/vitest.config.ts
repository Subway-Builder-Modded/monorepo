import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom/vitest", "./tests/setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    testTimeout: 10000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.test.tsx",
        "src/root.tsx",
        "src/app.tsx",
        "src/main.tsx",
        "src/**/index.ts",
        "src/**/types.ts",
      ],
      thresholds: {
        lines: 71,
        functions: 60,
        branches: 59,
        statements: 71,
      },
    },
  },
  resolve: {
    alias: [
      { find: "vite-plus/test", replacement: "vitest" },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
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
