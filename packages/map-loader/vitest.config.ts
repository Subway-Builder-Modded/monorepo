import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text"],
      // main.js/cities.js/layers.js are thin game-API glue exercised at runtime,
      // not in unit tests; the pure helpers below carry the coverage.
      exclude: [
        "**/*.test.js",
        "src/index.js",
        "src/main.js",
        "src/cities.js",
        "src/layers.js",
        "build.mjs",
      ],
    },
  },
});
