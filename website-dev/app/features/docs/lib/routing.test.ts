import { describe, expect, it } from "vite-plus/test";
import { matchDocsRoute, resolveDocsRoute, getDocsHomepageUrl, getDocPageUrl } from "@/app/features/docs/lib/routing";

describe("matchDocsRoute", () => {
  it("returns none for non-docs paths", () => {
    expect(matchDocsRoute("/", "")).toEqual({ kind: "none" });
    expect(matchDocsRoute("/railyard", "")).toEqual({ kind: "none" });
    expect(matchDocsRoute("/railyard/browse", "")).toEqual({ kind: "none" });
  });

  it("returns none for unknown suite", () => {
    expect(matchDocsRoute("/unknown/docs", "")).toEqual({ kind: "none" });
  });

  it("matches railyard docs homepage", () => {
    const result = matchDocsRoute("/railyard/docs", "");
    expect(result).toEqual({
      kind: "homepage",
      suiteId: "railyard",
      version: "v0.2",
    });
  });

  it("matches template-mod docs homepage", () => {
    const result = matchDocsRoute("/template-mod/docs", "");
    expect(result).toEqual({
      kind: "homepage",
      suiteId: "template-mod",
      version: "v1.0",
    });
  });

  it("matches docs homepage with version query param", () => {
    const result = matchDocsRoute("/railyard/docs", "?version=v0.1");
    expect(result).toEqual({
      kind: "homepage",
      suiteId: "railyard",
      version: "v0.1",
    });
  });

  it("redirects latest alias to actual version", () => {
    const result = matchDocsRoute("/railyard/docs", "?version=latest");
    expect(result).toEqual({
      kind: "redirect",
      to: "/railyard/docs?version=v0.2",
    });
  });

  it("redirects unknown version param to latest", () => {
    const result = matchDocsRoute("/railyard/docs", "?version=v9.9");
    expect(result).toEqual({
      kind: "redirect",
      to: "/railyard/docs?version=v0.2",
    });
  });

  it("matches doc page with version and slug", () => {
    const result = matchDocsRoute("/railyard/docs/v0.2/players", "");
    expect(result).toEqual({
      kind: "doc",
      suiteId: "railyard",
      version: "v0.2",
      slug: "players",
    });
  });

  it("matches doc page with deep slug", () => {
    const result = matchDocsRoute("/railyard/docs/v0.2/players/github-token", "");
    expect(result).toEqual({
      kind: "doc",
      suiteId: "railyard",
      version: "v0.2",
      slug: "players/github-token",
    });
  });

  it("redirects /latest/ paths to actual version", () => {
    const result = matchDocsRoute("/railyard/docs/latest", "");
    expect(result).toEqual({
      kind: "redirect",
      to: "/railyard/docs?version=v0.2",
    });
  });

  it("redirects /latest/slug paths to versioned slug", () => {
    const result = matchDocsRoute("/railyard/docs/latest/players/github-token", "");
    expect(result).toEqual({
      kind: "redirect",
      to: "/railyard/docs/v0.2/players/github-token",
    });
  });

  it("returns not-found for unknown version in path", () => {
    const result = matchDocsRoute("/railyard/docs/v9.9/something", "");
    expect(result).toEqual({
      kind: "not-found",
      suiteId: "railyard",
      reason: expect.stringContaining("v9.9"),
    });
  });
});

describe("resolveDocsRoute", () => {
  it("resolves homepage to ResolvedDocsRoute", () => {
    const result = resolveDocsRoute("/railyard/docs", "");
    expect(result).toEqual({
      suiteId: "railyard",
      version: "v0.2",
      docSlug: null,
      isHomepage: true,
    });
  });

  it("resolves doc page to ResolvedDocsRoute", () => {
    const result = resolveDocsRoute("/railyard/docs/v0.2/players/github-token", "");
    expect(result).toEqual({
      suiteId: "railyard",
      version: "v0.2",
      docSlug: "players/github-token",
      isHomepage: false,
    });
  });

  it("returns null for non-docs paths", () => {
    expect(resolveDocsRoute("/", "")).toBeNull();
    expect(resolveDocsRoute("/railyard", "")).toBeNull();
  });

  it("returns null for redirect (caller handles redirect)", () => {
    expect(resolveDocsRoute("/railyard/docs/latest", "")).toBeNull();
  });
});

describe("URL helpers", () => {
  it("getDocsHomepageUrl without version", () => {
    expect(getDocsHomepageUrl("railyard")).toBe("/railyard/docs");
  });

  it("getDocsHomepageUrl with version", () => {
    expect(getDocsHomepageUrl("railyard", "v0.1")).toBe("/railyard/docs?version=v0.1");
  });

  it("getDocPageUrl builds correct URL", () => {
    expect(getDocPageUrl("railyard", "v0.2", "players/github-token")).toBe(
      "/railyard/docs/v0.2/players/github-token",
    );
  });
});
