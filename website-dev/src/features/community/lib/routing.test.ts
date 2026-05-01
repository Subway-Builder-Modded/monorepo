import { describe, expect, it } from "vitest";
import { getCommunityPageUrl, matchCommunityRoute } from "./routing";

describe("matchCommunityRoute", () => {
  it("matches /community route", () => {
    const match = matchCommunityRoute("/community");
    expect(match.kind).toBe("page");
    if (match.kind === "page") {
      expect(match.pageId).toBe("community");
    }
  });

  it("returns none for non-matching paths", () => {
    expect(matchCommunityRoute("/").kind).toBe("none");
    expect(matchCommunityRoute("/credits").kind).toBe("none");
    expect(matchCommunityRoute("/community/nested").kind).toBe("none");
  });
});

describe("getCommunityPageUrl", () => {
  it("returns /community", () => {
    expect(getCommunityPageUrl()).toBe("/community");
  });
});
