import { describe, expect, it } from "vitest";
import {
  getMarkdownPlaygroundUrl,
  matchMarkdownPlaygroundRoute,
} from "@/features/markdown-playground/lib/routing";

describe("matchMarkdownPlaygroundRoute", () => {
  it("matches exact registry markdown playground path", () => {
    expect(matchMarkdownPlaygroundRoute("/registry/markdown-playground")).toEqual({
      kind: "page",
      pageId: "registry-markdown-playground",
    });
  });

  it("returns none for non-playground paths", () => {
    expect(matchMarkdownPlaygroundRoute("/registry/docs")).toEqual({ kind: "none" });
  });

  it("returns canonical route URL", () => {
    expect(getMarkdownPlaygroundUrl()).toBe("/registry/markdown-playground");
  });
});
