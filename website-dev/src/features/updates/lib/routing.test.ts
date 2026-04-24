import { describe, expect, it } from "vitest";
import { getUpdatePageUrl, getUpdatesHomepageUrl, matchUpdatesRoute } from "@/features/updates/lib/routing";

describe("matchUpdatesRoute", () => {
  it("returns none for non-updates paths", () => {
    expect(matchUpdatesRoute("/railyard/docs")).toEqual({ kind: "none" });
    expect(matchUpdatesRoute("/")).toEqual({ kind: "none" });
  });

  it("matches suite updates homepage", () => {
    expect(matchUpdatesRoute("/railyard/updates")).toEqual({
      kind: "homepage",
      suiteId: "railyard",
    });
  });

  it("matches suite update page", () => {
    expect(matchUpdatesRoute("/template-mod/updates/v1.0.0")).toEqual({
      kind: "update",
      suiteId: "template-mod",
      slug: "v1.0.0",
    });
  });

  it("matches nested update page", () => {
    expect(matchUpdatesRoute("/railyard/updates/v0.2.1/rc/candidate-a")).toEqual({
      kind: "update",
      suiteId: "railyard",
      slug: "v0.2.1/rc/candidate-a",
    });
  });

  it("returns none for foundry updates paths while foundry is disabled", () => {
    expect(matchUpdatesRoute("/foundry/updates")).toEqual({ kind: "none" });
    expect(matchUpdatesRoute("/foundry/updates/v0.1.0")).toEqual({ kind: "none" });
  });
});

describe("updates URL helpers", () => {
  it("builds homepage and update URLs", () => {
    expect(getUpdatesHomepageUrl("website")).toBe("/website/updates");
    expect(getUpdatePageUrl("template-mod", "v1.0.0")).toBe("/template-mod/updates/v1.0.0");
  });
});
