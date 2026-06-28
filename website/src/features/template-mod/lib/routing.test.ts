import { describe, expect, it } from "vitest";
import { getTemplateModPageUrl, matchTemplateModRoute } from "./routing";

describe("matchTemplateModRoute", () => {
  it("matches /template-mod route", () => {
    const match = matchTemplateModRoute("/template-mod");

    expect(match).toEqual({ kind: "page", pageId: "template-mod" });
  });

  it("matches route without a leading slash", () => {
    const match = matchTemplateModRoute("template-mod");

    expect(match).toEqual({ kind: "page", pageId: "template-mod" });
  });

  it("normalizes trailing slash", () => {
    const match = matchTemplateModRoute("/template-mod/");

    expect(match).toEqual({ kind: "page", pageId: "template-mod" });
  });

  it("returns none for non-matching routes", () => {
    expect(matchTemplateModRoute("/").kind).toBe("none");
    expect(matchTemplateModRoute("/template-mod/docs").kind).toBe("none");
  });
});

describe("getTemplateModPageUrl", () => {
  it("returns canonical template-mod route", () => {
    expect(getTemplateModPageUrl()).toBe("/template-mod");
  });
});
