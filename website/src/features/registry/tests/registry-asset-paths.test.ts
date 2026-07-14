import { describe, expect, it } from "vitest";
import {
  getRegistryCollectionCachePath,
  getRegistryItemCachePath,
  getRegistryMapBasemapUrl,
} from "@/features/registry/lib/registry-asset-paths";

describe("registry asset paths", () => {
  it("keeps local registry cache metadata paths under registry-cache", () => {
    expect(getRegistryCollectionCachePath("maps")).toBe("/registry-cache/maps");
    expect(getRegistryItemCachePath("maps", "example map", "manifest.json")).toBe(
      "/registry-cache/maps/example%20map/manifest.json",
    );
  });

  it("builds remote map-data basemap URLs", () => {
    expect(getRegistryMapBasemapUrl("example-map")).toBe(
      "https://raw.githubusercontent.com/Subway-Builder-Modded/registry/map-data/maps/example-map/basemap.svg",
    );
    expect(getRegistryMapBasemapUrl("space map")).toBe(
      "https://raw.githubusercontent.com/Subway-Builder-Modded/registry/map-data/maps/space%20map/basemap.svg",
    );
    expect(getRegistryMapBasemapUrl("slash/map")).toContain("slash%2Fmap");
    expect(getRegistryMapBasemapUrl("example-map")).not.toContain("/registry-cache");
  });
});
