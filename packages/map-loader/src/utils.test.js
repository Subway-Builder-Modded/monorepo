import { describe, expect, it } from "vitest";
import {
  capitalizeString,
  getCountryName,
  getFlagEmoji,
  semverCompare,
} from "./utils.js";

describe("semverCompare", () => {
  it("returns true only when v1 is strictly greater than v2", () => {
    expect(semverCompare("1.4.0", "1.3.6")).toBe(true);
    expect(semverCompare("2.0.0", "1.9.9")).toBe(true);
    expect(semverCompare("1.3.7", "1.3.6")).toBe(true);
    expect(semverCompare("1.3.6", "1.3.6")).toBe(false);
    expect(semverCompare("1.3.5", "1.3.6")).toBe(false);
    expect(semverCompare("1.2.9", "1.3.0")).toBe(false);
  });
});

describe("capitalizeString", () => {
  it("upper-cases the first char and lower-cases the rest", () => {
    expect(capitalizeString("DARK")).toBe("Dark");
    expect(capitalizeString("light")).toBe("Light");
  });
});

describe("getFlagEmoji", () => {
  it("maps a country code to its regional-indicator flag", () => {
    expect(getFlagEmoji("JP")).toBe("\u{1F1EF}\u{1F1F5}");
    expect(getFlagEmoji("fr")).toBe("\u{1F1EB}\u{1F1F7}");
  });
});

describe("getCountryName", () => {
  it("resolves a country code to its English display name", () => {
    expect(getCountryName("JP")).toBe("Japan");
    expect(getCountryName("fr")).toBe("France");
  });
});
