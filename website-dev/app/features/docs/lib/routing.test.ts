import { describe, expect, it } from "vite-plus/test";
import {
  getDocPageUrl,
  getDocsHomepageUrl,
  matchDocsRoute,
  resolveDocsRoute,
} from "@/app/features/docs/lib/routing";

describe("matchDocsRoute", () => {
  it("returns none for non-docs paths", () => {
    expect(matchDocsRoute("/", "")).toEqual({ kind: "none" });
    expect(matchDocsRoute("/railyard", "")).toEqual({ kind: "none" });
    expect(matchDocsRoute("/railyard/browse", "")).toEqual({ kind: "none" });
  });

  it("returns none for unknown suite", () => {
    expect(matchDocsRoute("/unknown/docs", "")).toEqual({ kind: "none" });
  });

  it("matches versioned docs homepages", () => {
    expect(matchDocsRoute("/railyard/docs", "")).toEqual({
      kind: "homepage",
      suiteId: "railyard",
      version: "v0.2",
    });

    expect(matchDocsRoute("/template-mod/docs", "")).toEqual({
      kind: "homepage",
      suiteId: "template-mod",
      version: "v1.0",
    });
  });

  it("matches non-versioned registry homepage", () => {
    expect(matchDocsRoute("/registry/docs", "")).toEqual({
      kind: "homepage",
      suiteId: "registry",
      version: null,
    });
  });

  it("matches docs homepage with version query param for versioned suites", () => {
    const result = matchDocsRoute("/railyard/docs", "?version=v0.1");
    expect(result).toEqual({
      kind: "homepage",
      suiteId: "railyard",
      version: "v0.1",
    });
  });

  it("redirects latest alias only for versioned suites", () => {
    expect(matchDocsRoute("/railyard/docs", "?version=latest")).toEqual({
      kind: "redirect",
      to: "/railyard/docs?version=v0.2",
    });

    // Non-versioned suites canonicalize to no query
    expect(matchDocsRoute("/registry/docs", "?version=latest")).toEqual({
      kind: "redirect",
      to: "/registry/docs",
    });
  });

  it("redirects unknown version query param to latest for versioned suites", () => {
    const result = matchDocsRoute("/railyard/docs", "?version=v9.9");
    expect(result).toEqual({
      kind: "redirect",
      to: "/railyard/docs?version=v0.2",
    });
  });

  it("matches versioned doc pages", () => {
    expect(matchDocsRoute("/railyard/docs/v0.2/players", "")).toEqual({
      kind: "doc",
      suiteId: "railyard",
      version: "v0.2",
      slug: "players",
    });

    expect(matchDocsRoute("/railyard/docs/v0.2/players/github-token", "")).toEqual({
      kind: "doc",
      suiteId: "railyard",
      version: "v0.2",
      slug: "players/github-token",
    });
  });

  it("matches non-versioned registry doc pages", () => {
    expect(matchDocsRoute("/registry/docs/publishing-projects", "")).toEqual({
      kind: "doc",
      suiteId: "registry",
      version: null,
      slug: "publishing-projects",
    });

    expect(matchDocsRoute("/registry/docs/latest", "")).toEqual({
      kind: "doc",
      suiteId: "registry",
      version: null,
      slug: "latest",
    });
  });

  it("redirects /latest aliases only for versioned suites", () => {
    expect(matchDocsRoute("/railyard/docs/latest", "")).toEqual({
      kind: "redirect",
      to: "/railyard/docs?version=v0.2",
    });

    expect(matchDocsRoute("/railyard/docs/latest/players/github-token", "")).toEqual({
      kind: "redirect",
      to: "/railyard/docs/v0.2/players/github-token",
    });
  });

  it("returns not-found for unknown version in versioned path", () => {
    const result = matchDocsRoute("/railyard/docs/v9.9/something", "");
    expect(result).toEqual({
      kind: "not-found",
      suiteId: "railyard",
      reason: expect.stringContaining("v9.9"),
    });
  });
});

describe("resolveDocsRoute", () => {
  it("resolves versioned homepage", () => {
    const result = resolveDocsRoute("/railyard/docs", "");
    expect(result).toEqual({
      suiteId: "railyard",
      version: "v0.2",
      docSlug: null,
      isHomepage: true,
    });
  });

  it("resolves non-versioned homepage", () => {
    const result = resolveDocsRoute("/registry/docs", "");
    expect(result).toEqual({
      suiteId: "registry",
      version: null,
      docSlug: null,
      isHomepage: true,
    });
  });

  it("resolves doc pages", () => {
    expect(resolveDocsRoute("/railyard/docs/v0.2/players/github-token", "")).toEqual({
      suiteId: "railyard",
      version: "v0.2",
      docSlug: "players/github-token",
      isHomepage: false,
    });

    expect(resolveDocsRoute("/registry/docs/publishing-projects", "")).toEqual({
      suiteId: "registry",
      version: null,
      docSlug: "publishing-projects",
      isHomepage: false,
    });
  });

  it("returns null for non-docs paths", () => {
    expect(resolveDocsRoute("/", "")).toBeNull();
    expect(resolveDocsRoute("/railyard", "")).toBeNull();
  });

  it("returns null for redirects", () => {
    expect(resolveDocsRoute("/railyard/docs/latest", "")).toBeNull();
  });
});

describe("URL helpers", () => {
  it("builds homepage URLs for versioned and non-versioned suites", () => {
    expect(getDocsHomepageUrl("railyard")).toBe("/railyard/docs");
    expect(getDocsHomepageUrl("railyard", "v0.1")).toBe("/railyard/docs?version=v0.1");
    expect(getDocsHomepageUrl("registry", null)).toBe("/registry/docs");
  });

  it("builds doc page URLs for versioned and non-versioned suites", () => {
    expect(getDocPageUrl("railyard", "v0.2", "players/github-token")).toBe(
      "/railyard/docs/v0.2/players/github-token",
    );

    expect(getDocPageUrl("registry", null, "publishing-projects")).toBe(
      "/registry/docs/publishing-projects",
    );
  });
});
