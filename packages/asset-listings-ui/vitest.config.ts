import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text"],
      exclude: ["**/*.d.ts", "**/*.test.ts", "**/*.test.tsx", "src/**/index.ts", "src/**/types.ts"],
      thresholds: {
        lines: 74,
        functions: 83,
        branches: 52,
        statements: 77,
      },
    },
  },
});
