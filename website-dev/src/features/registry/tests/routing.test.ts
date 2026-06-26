import { describe, expect, it } from "vitest";
import {
  getRegistryAuthorUrl,
  getRegistryDetailUrl,
  getRegistryPageUrl,
  getRegistryProjectUrl,
  getRegistryVersionUrl,
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

  it("matches author routes before generic detail routes", () => {
    expect(matchRegistryRoute("/registry/authors/ahkimn")).toEqual({
      kind: "author",
      authorId: "ahkimn",
    });
  });

  it("matches author tab routes", () => {
    expect(matchRegistryRoute("/registry/authors/ahkimn/analytics")).toEqual({
      kind: "author",
      authorId: "ahkimn",
      tabId: "analytics",
    });
    expect(matchRegistryRoute("/registry/authors/ahkimn/projects")).toEqual({
      kind: "author",
      authorId: "ahkimn",
      tabId: "projects",
    });
  });

  it("matches project routes under author routes", () => {
    expect(matchRegistryRoute("/registry/authors/ahkimn/subwaybuilder-jp-maps")).toEqual({
      kind: "project",
      authorId: "ahkimn",
      projectName: "subwaybuilder-jp-maps",
    });
  });

  it("matches project tab routes", () => {
    expect(matchRegistryRoute("/registry/authors/ahkimn/subwaybuilder-jp-maps/analytics")).toEqual({
      kind: "project",
      authorId: "ahkimn",
      projectName: "subwaybuilder-jp-maps",
      tabId: "analytics",
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

  it("matches version changelog subroute", () => {
    expect(matchRegistryRoute("/registry/maps/gwangju-4/versions/v1.0.0")).toEqual({
      kind: "detail",
      routeSegment: "maps",
      id: "gwangju-4",
      tabId: "versions",
      versionId: "v1.0.0",
    });
  });

  it("returns none for invalid detail tab subpage", () => {
    expect(matchRegistryRoute("/registry/maps/gwangju-4/not-a-tab")).toEqual({ kind: "none" });
    expect(matchRegistryRoute("/registry/authors/ahkimn/project/not-a-tab")).toEqual({
      kind: "none",
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

describe("getRegistryAuthorUrl", () => {
  it("builds author tab URLs and omits overview", () => {
    expect(getRegistryAuthorUrl("ahkimn")).toBe("/registry/authors/ahkimn");
    expect(getRegistryAuthorUrl("ahkimn", "overview")).toBe("/registry/authors/ahkimn");
    expect(getRegistryAuthorUrl("ahkimn", "analytics")).toBe("/registry/authors/ahkimn/analytics");
    expect(getRegistryAuthorUrl("ahkimn", "projects")).toBe("/registry/authors/ahkimn/projects");
  });
});

describe("getRegistryProjectUrl", () => {
  it("builds project tab URLs and omits overview", () => {
    expect(getRegistryProjectUrl("ahkimn", "subwaybuilder-jp-maps")).toBe(
      "/registry/authors/ahkimn/subwaybuilder-jp-maps",
    );
    expect(getRegistryProjectUrl("ahkimn", "subwaybuilder-jp-maps", "overview")).toBe(
      "/registry/authors/ahkimn/subwaybuilder-jp-maps",
    );
    expect(getRegistryProjectUrl("ahkimn", "subwaybuilder-jp-maps", "analytics")).toBe(
      "/registry/authors/ahkimn/subwaybuilder-jp-maps/analytics",
    );
  });
});

describe("getRegistryVersionUrl", () => {
  it("builds encoded versions changelog URL", () => {
    expect(getRegistryVersionUrl("maps", "gwangju 4", "v1.0.0")).toBe(
      "/registry/maps/gwangju%204/versions/v1.0.0",
    );
  });
});

describe("getRegistryPageUrl", () => {
  it("builds canonical typed registry page URLs", () => {
    expect(getRegistryPageUrl()).toBe("/registry/maps");
    expect(getRegistryPageUrl("mods")).toBe("/registry/mods");
  });
});
