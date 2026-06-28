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

  it("matches creator database route before author routes", () => {
    expect(matchRegistryRoute("/registry/authors")).toEqual({
      kind: "creatorDatabase",
      tabId: "authors",
    });
    expect(matchRegistryRoute("/registry/authors/projects")).toEqual({
      kind: "creatorDatabase",
      tabId: "projects",
    });
  });

  it("matches registry analytics routes before detail routes", () => {
    expect(matchRegistryRoute("/registry/analytics")).toEqual({
      kind: "analytics",
      tabId: "overview",
      periodId: "all-time",
    });
    expect(matchRegistryRoute("/registry/analytics/overview")).toEqual({
      kind: "analytics",
      tabId: "overview",
      periodId: "all-time",
    });
    expect(matchRegistryRoute("/registry/analytics/overview/7d")).toEqual({
      kind: "analytics",
      tabId: "overview",
      periodId: "7d",
    });
    expect(matchRegistryRoute("/registry/analytics/content")).toEqual({
      kind: "analytics",
      tabId: "content",
      periodId: "all-time",
      assetTypeId: "maps",
    });
    expect(matchRegistryRoute("/registry/analytics/content/7d/mods")).toEqual({
      kind: "analytics",
      tabId: "content",
      periodId: "7d",
      assetTypeId: "mods",
    });
    expect(matchRegistryRoute("/registry/analytics/projects")).toEqual({
      kind: "analytics",
      tabId: "projects",
      periodId: undefined,
      assetTypeId: undefined,
    });
  });

  it("matches detail routes and version subroutes", () => {
    expect(matchRegistryRoute("/registry/maps/asset-a")).toEqual({
      kind: "detail",
      routeSegment: "maps",
      id: "asset-a",
    });
    expect(matchRegistryRoute("/registry/maps/asset-a/analytics")).toEqual({
      kind: "detail",
      routeSegment: "maps",
      id: "asset-a",
      tabId: "analytics",
    });
    expect(matchRegistryRoute("/registry/maps/asset-a/versions/v1.0.0")).toEqual({
      kind: "detail",
      routeSegment: "maps",
      id: "asset-a",
      tabId: "versions",
      versionId: "v1.0.0",
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
    expect(matchRegistryRoute("/registry/authors/author-a/project-a")).toEqual({
      kind: "project",
      authorId: "author-a",
      projectName: "project-a",
    });
    expect(matchRegistryRoute("/registry/authors/author-a/project-a/analytics")).toEqual({
      kind: "project",
      authorId: "author-a",
      projectName: "project-a",
      tabId: "analytics",
    });
  });

  it("returns none for invalid detail tab subpage", () => {
    expect(matchRegistryRoute("/registry/maps/asset-a/not-a-tab")).toEqual({ kind: "none" });
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

  it("builds detail tab and version URLs", () => {
    expect(getRegistryDetailUrl("maps", "asset-a", "analytics")).toBe(
      "/registry/maps/asset-a/analytics",
    );
    expect(getRegistryVersionUrl("maps", "asset a", "v1.0.0")).toBe(
      "/registry/maps/asset%20a/versions/v1.0.0",
    );
  });
});

describe("getRegistryAuthorUrl", () => {
  it("builds author tab URLs and omits overview", () => {
    expect(getRegistryAuthorUrl("author-a")).toBe("/registry/authors/author-a");
    expect(getRegistryAuthorUrl("author-a", "overview")).toBe("/registry/authors/author-a");
    expect(getRegistryAuthorUrl("author-a", "analytics")).toBe(
      "/registry/authors/author-a/analytics",
    );
    expect(getRegistryAuthorUrl("author-a", "projects")).toBe("/registry/authors/author-a/projects");
  });
});

describe("getRegistryProjectUrl", () => {
  it("builds project tab URLs and omits overview", () => {
    expect(getRegistryProjectUrl("author-a", "project-a")).toBe(
      "/registry/authors/author-a/project-a",
    );
    expect(getRegistryProjectUrl("author-a", "project-a", "overview")).toBe(
      "/registry/authors/author-a/project-a",
    );
    expect(getRegistryProjectUrl("author-a", "project-a", "analytics")).toBe(
      "/registry/authors/author-a/project-a/analytics",
    );
  });
});

describe("getRegistryPageUrl", () => {
  it("builds canonical typed registry page URLs", () => {
    expect(getRegistryPageUrl()).toBe("/registry/maps");
    expect(getRegistryPageUrl("mods")).toBe("/registry/mods");
  });
});
