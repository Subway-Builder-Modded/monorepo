import { describe, expect, it } from "vitest";
import {
  getRegistryDetailUrl,
  getRegistryPageUrl,
  matchRegistryRoute,
} from "@/features/registry/lib/routing";

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

  it("matches detail route with tab subpage", () => {
    expect(matchRegistryRoute("/registry/maps/gwangju-4/analytics")).toEqual({
      kind: "detail",
      routeSegment: "maps",
      id: "gwangju-4",
      tabId: "analytics",
    });
  });

  it("returns none for invalid detail tab subpage", () => {
    expect(matchRegistryRoute("/registry/maps/gwangju-4/not-a-tab")).toEqual({ kind: "none" });
  });

  it("returns none for unrelated route", () => {
    expect(matchRegistryRoute("/railyard")).toEqual({ kind: "none" });
  });
});

describe("getRegistryDetailUrl", () => {
  it("builds encoded detail URL", () => {
    expect(getRegistryDetailUrl("mods", "my mod")).toBe("/registry/mods/my%20mod");
  });

  it("builds detail tab URL and omits default description tab", () => {
    expect(getRegistryDetailUrl("maps", "gwangju-4", "analytics")).toBe(
      "/registry/maps/gwangju-4/analytics",
    );
    expect(getRegistryDetailUrl("maps", "gwangju-4", "description")).toBe(
      "/registry/maps/gwangju-4/description",
    );
    expect(getRegistryDetailUrl("maps", "gwangju-4")).toBe("/registry/maps/gwangju-4");
  });
});

describe("getRegistryPageUrl", () => {
  it("builds canonical typed registry page URLs", () => {
    expect(getRegistryPageUrl()).toBe("/registry/maps");
    expect(getRegistryPageUrl("mods")).toBe("/registry/mods");
  });
});
