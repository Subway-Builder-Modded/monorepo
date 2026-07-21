import { describe, expect, it, vi } from "vitest";
import { generateTabs, registerCountryTabs } from "./tabs.js";

describe("generateTabs", () => {
  it("groups city codes by country, skipping US and country-less places", () => {
    const tabs = generateTabs([
      { code: "PAR", country: "FR" },
      { code: "LYO", country: "FR" },
      { code: "NYC", country: "US" },
      { code: "XXX" }, // no country
      { code: "TYO", country: "JP" },
    ]);
    expect(tabs).toEqual({ FR: ["PAR", "LYO"], JP: ["TYO"] });
  });
});

describe("registerCountryTabs", () => {
  it("registers one tab per country in alphabetical order of display name", () => {
    const calls = [];
    const api = { cities: { registerTab: (t) => calls.push(t) } };
    vi.spyOn(console, "log").mockImplementation(() => {});

    // Config order is JP, FR, DE -> expect display-name order France, Germany, Japan.
    registerCountryTabs(
      [
        { code: "TYO", country: "JP" },
        { code: "PAR", country: "FR" },
        { code: "BER", country: "DE" },
      ],
      api,
    );

    expect(calls.map((c) => c.id)).toEqual(["FR", "DE", "JP"]);
    expect(calls.map((c) => c.label)).toEqual(["France", "Germany", "Japan"]);
    // Each tab carries its grouped city codes and a flag emoji.
    expect(calls[0]).toMatchObject({ id: "FR", cityCodes: ["PAR"] });
    expect(calls[0].emoji).toBeTruthy();
  });
});
