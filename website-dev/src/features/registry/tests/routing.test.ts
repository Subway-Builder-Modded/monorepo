import { describe, expect, it } from "vitest";
import { getRegistryDetailUrl, getRegistryPageUrl, matchRegistryRoute } from "@/features/registry/lib/routing";

describe("matchRegistryRoute", () => {
  it("matches /registry homepage", () => {
    expect(matchRegistryRoute("/registry")).toEqual({ kind: "page", pageId: "registry" });
  });

  it("matches typed registry homepage routes", () => {
    expect(matchRegistryRoute("/registry/maps")).toEqual({ kind: "page", pageId: "registry" });
    expect(matchRegistryRoute("/registry/mods")).toEqual({ kind: "page", pageId: "registry" });
  });

  it("matches detail route", () => {
    expect(matchRegistryRoute("/registry/maps/gwangju-4")).toEqual({
      kind: "detail",
      routeSegment: "maps",
      id: "gwangju-4",
    });
  });

  it("returns none for unrelated route", () => {
    expect(matchRegistryRoute("/railyard")).toEqual({ kind: "none" });
  });
});

describe("getRegistryDetailUrl", () => {
  it("builds encoded detail URL", () => {
    expect(getRegistryDetailUrl("mods", "my mod")).toBe("/registry/mods/my%20mod");
  });
});

describe("getRegistryPageUrl", () => {
  it("builds canonical typed registry page URLs", () => {
    expect(getRegistryPageUrl()).toBe("/registry/maps");
    expect(getRegistryPageUrl("mods")).toBe("/registry/mods");
  });
});
