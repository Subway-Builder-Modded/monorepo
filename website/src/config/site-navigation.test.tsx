import { describe, expect, it } from "vitest";
import {
  getActiveSuite,
  getMatchingItem,
  getSuiteDocsNavItem,
  getSuiteUpdatesNavItem,
} from "@/config/site-navigation";

describe("site-navigation helpers", () => {
  it("falls back to the general suite for unmatched paths", () => {
    expect(getActiveSuite("/missing/path").id).toBe("general");
  });

  it("returns null when no suite item matches a path", () => {
    expect(getMatchingItem("/registry/not-a-route", "registry")).toBeNull();
  });

  it("returns null for suites without docs or updates navigation entries", () => {
    expect(getSuiteDocsNavItem("general")).toBeNull();
    expect(getSuiteUpdatesNavItem("general")).toBeNull();
  });
});
