import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["@testing-library/jest-dom/vitest"],
    coverage: {
      provider: "v8",
      reporter: ["text"],
      exclude: [
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.test.tsx",
        "src/**/index.ts",
      ],
    },
  },
});
