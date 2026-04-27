import { describe, expect, it } from "vitest";
import { getContributePageUrl, matchContributeRoute } from "./routing";

describe("matchContributeRoute", () => {
  it("matches /contribute route", () => {
    const match = matchContributeRoute("/contribute");
    expect(match.kind).toBe("page");
    if (match.kind === "page") {
      expect(match.pageId).toBe("contribute");
    }
  });

  it("returns none for non-matching routes", () => {
    expect(matchContributeRoute("/").kind).toBe("none");
    expect(matchContributeRoute("/license").kind).toBe("none");
    expect(matchContributeRoute("/credits").kind).toBe("none");
    expect(matchContributeRoute("/community").kind).toBe("none");
    expect(matchContributeRoute("/contribute/extra").kind).toBe("none");
  });

  it("normalizes pathname without leading slash", () => {
    const match = matchContributeRoute("contribute");
    expect(match.kind).toBe("page");
  });
});

describe("getContributePageUrl", () => {
  it("returns canonical contribute URL", () => {
    expect(getContributePageUrl()).toBe("/contribute");
  });
});
