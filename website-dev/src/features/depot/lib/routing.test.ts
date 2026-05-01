import { describe, expect, it } from "vitest";
import { getDepotPageUrl, matchDepotRoute } from "@/features/depot/lib/routing";

describe("depot routing", () => {
  it("matches the /depot page", () => {
    expect(matchDepotRoute("/depot")).toEqual({ kind: "page", pageId: "depot" });
  });

  it("returns none for non-depot routes", () => {
    expect(matchDepotRoute("/depot/updates")).toEqual({ kind: "none" });
    expect(matchDepotRoute("/railyard")).toEqual({ kind: "none" });
  });

  it("builds the depot page url", () => {
    expect(getDepotPageUrl()).toBe("/depot");
  });
});
