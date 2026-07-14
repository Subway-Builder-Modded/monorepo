import { describe, expect, it } from "vitest";

const {
  assertNoProhibitedGeneratedRegistryAssets,
  getPinnedRegistryRawUrl,
  transformRegistryListingManifest,
} =
  // @ts-expect-error Node script helpers are authored as .mjs for direct execution.
  await import("./registry-site-data-materializer.mjs");

const COMMIT_SHA = "abc123def456";

describe("registry site data materializer", () => {
  it("rewrites relative map gallery paths to commit-pinned raw GitHub URLs", () => {
    const result = transformRegistryListingManifest(
      { gallery: ["gallery/screenshot1.webp"] },
      { commitSha: COMMIT_SHA, routeSegment: "maps", id: "example-map" },
    );

    expect(result.manifest.gallery).toEqual([
      "https://raw.githubusercontent.com/Subway-Builder-Modded/registry/abc123def456/maps/example-map/gallery/screenshot1.webp",
    ]);
    expect(result.rewrittenCount).toBe(1);
  });

  it("rewrites relative mod gallery paths to commit-pinned raw GitHub URLs", () => {
    const result = transformRegistryListingManifest(
      { gallery: ["gallery/screenshot1.webp"] },
      { commitSha: COMMIT_SHA, routeSegment: "mods", id: "example-mod" },
    );

    expect(result.manifest.gallery).toEqual([
      "https://raw.githubusercontent.com/Subway-Builder-Modded/registry/abc123def456/mods/example-mod/gallery/screenshot1.webp",
    ]);
  });

  it("preserves external and root-relative gallery URLs", () => {
    const gallery = [
      "https://cdn.example.test/remote.webp",
      "http://cdn.example.test/remote.webp",
      "/images/local.webp",
    ];
    const result = transformRegistryListingManifest(
      { gallery },
      { commitSha: COMMIT_SHA, routeSegment: "maps", id: "example-map" },
    );

    expect(result.manifest.gallery).toEqual(gallery);
    expect(result.rewrittenCount).toBe(0);
  });

  it("keeps empty and missing galleries valid", () => {
    expect(
      transformRegistryListingManifest(
        { gallery: [] },
        { commitSha: COMMIT_SHA, routeSegment: "maps", id: "example-map" },
      ).manifest.gallery,
    ).toEqual([]);
    expect(
      transformRegistryListingManifest(
        { name: "No Gallery" },
        { commitSha: COMMIT_SHA, routeSegment: "maps", id: "example-map" },
      ).manifest,
    ).toEqual({ name: "No Gallery" });
  });

  it("encodes path segments without encoding path separators", () => {
    expect(
      getPinnedRegistryRawUrl(COMMIT_SHA, "maps", "space map", "gallery/special #1.webp"),
    ).toBe(
      "https://raw.githubusercontent.com/Subway-Builder-Modded/registry/abc123def456/maps/space%20map/gallery/special%20%231.webp",
    );
  });

  it("preserves gallery order across multiple entries", () => {
    const result = transformRegistryListingManifest(
      { gallery: ["gallery/a.webp", "https://cdn.example.test/b.webp", "gallery/c.webp"] },
      { commitSha: COMMIT_SHA, routeSegment: "maps", id: "ordered-map" },
    );

    expect(result.manifest.gallery).toEqual([
      "https://raw.githubusercontent.com/Subway-Builder-Modded/registry/abc123def456/maps/ordered-map/gallery/a.webp",
      "https://cdn.example.test/b.webp",
      "https://raw.githubusercontent.com/Subway-Builder-Modded/registry/abc123def456/maps/ordered-map/gallery/c.webp",
    ]);
  });

  it("detects prohibited generated registry assets only inside registry cache listings", () => {
    expect(() =>
      assertNoProhibitedGeneratedRegistryAssets([
        "public/registry-cache/maps/example/gallery/screenshot.webp",
      ]),
    ).toThrow("public/registry-cache/maps/example/gallery/screenshot.webp");
    expect(() =>
      assertNoProhibitedGeneratedRegistryAssets(["public/registry-cache/maps/example/basemap.svg"]),
    ).toThrow("public/registry-cache/maps/example/basemap.svg");
    expect(() =>
      assertNoProhibitedGeneratedRegistryAssets([
        "public/registry-cache/mods/example/gallery/screenshot.webp",
      ]),
    ).toThrow("public/registry-cache/mods/example/gallery/screenshot.webp");

    expect(() =>
      assertNoProhibitedGeneratedRegistryAssets([
        "public/registry-cache/maps/example/manifest.json",
        "public/registry-cache/maps/example/grid.geojson",
        "website/public/images/example.svg",
      ]),
    ).not.toThrow();
  });
});
