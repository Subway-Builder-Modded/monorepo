import { describe, expect, it } from "vitest";
import { countRegistryManifestRecords } from "@/features/railyard/railyard-registry-summary";

describe("railyard registry summary", () => {
  it("counts manifests when is_test is false", () => {
    const count = countRegistryManifestRecords({
      "/manifest-a.json": JSON.stringify({ id: "a", name: "A", is_test: false }),
      "/manifest-b.json": JSON.stringify({ id: "b", name: "B", is_test: false }),
    });

    expect(count).toBe(2);
  });

  it("excludes manifests when is_test is true", () => {
    const count = countRegistryManifestRecords({
      "/manifest-a.json": JSON.stringify({ id: "a", name: "A", is_test: true }),
      "/manifest-b.json": JSON.stringify({ id: "b", name: "B", is_test: false }),
    });

    expect(count).toBe(1);
  });

  it("handles missing or malformed manifest data safely", () => {
    const count = countRegistryManifestRecords({
      "/manifest-a.json": "{not-json",
      "/manifest-b.json": JSON.stringify(null),
      "/manifest-c.json": JSON.stringify({ id: "c", name: "C" }),
    });

    expect(count).toBe(1);
  });
});
