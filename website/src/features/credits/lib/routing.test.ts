import { describe, expect, it } from "vitest";
import { getCreditsPageUrl, matchCreditsRoute } from "./routing";

describe("matchCreditsRoute", () => {
  it("matches /credits route", () => {
    const match = matchCreditsRoute("/credits");
    expect(match.kind).toBe("page");
    if (match.kind === "page") {
      expect(match.pageId).toBe("credits");
    }
  });

  it("returns none for non-matching routes", () => {
    expect(matchCreditsRoute("/").kind).toBe("none");
    expect(matchCreditsRoute("/license").kind).toBe("none");
    expect(matchCreditsRoute("/community").kind).toBe("none");
    expect(matchCreditsRoute("/credits/team").kind).toBe("none");
  });
});

describe("getCreditsPageUrl", () => {
  it("returns canonical credits URL", () => {
    expect(getCreditsPageUrl()).toBe("/credits");
  });
});
