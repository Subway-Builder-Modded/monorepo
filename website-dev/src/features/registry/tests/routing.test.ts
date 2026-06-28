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

  it("returns none for invalid detail tab subpage", () => {
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
});

describe("getRegistryPageUrl", () => {
  it("builds canonical typed registry page URLs", () => {
    expect(getRegistryPageUrl()).toBe("/registry/maps");
    expect(getRegistryPageUrl("mods")).toBe("/registry/mods");
  });
});
