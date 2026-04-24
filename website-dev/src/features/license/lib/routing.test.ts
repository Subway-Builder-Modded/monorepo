import { describe, expect, it } from "vitest";
import { matchLicenseRoute, getLicensePageUrl } from "./routing";

describe("matchLicenseRoute", () => {
  it("matches /license route", () => {
    const match = matchLicenseRoute("/license");
    expect(match.kind).toBe("page");
    if (match.kind === "page") {
      expect(match.pageId).toBe("license");
    }
  });

  it("returns none for non-matching routes", () => {
    const match = matchLicenseRoute("/unknown");
    expect(match.kind).toBe("none");
  });

  it("returns none for updates and docs routes", () => {
    expect(matchLicenseRoute("/railyard/updates/1.0.0").kind).toBe("none");
    expect(matchLicenseRoute("/railyard/docs").kind).toBe("none");
    expect(matchLicenseRoute("/community").kind).toBe("none");
    expect(matchLicenseRoute("/credits").kind).toBe("none");
    expect(matchLicenseRoute("/contribute").kind).toBe("none");
  });
});

describe("getLicensePageUrl", () => {
  it("returns correct URL for license page", () => {
    expect(getLicensePageUrl()).toBe("/license");
  });
});
