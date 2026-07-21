import { describe, expect, it } from "vitest";
import {
  isUsablePath,
  parseModdedPathRequest,
  urlFromFetchInput,
} from "./driving-path.js";

describe("parseModdedPathRequest", () => {
  it("parses a well-formed modded path url", () => {
    expect(parseModdedPathRequest("map://paths/KUN/pop-42")).toEqual({
      cityCode: "KUN",
      popId: "pop-42",
    });
  });

  it("returns null for non-matching urls", () => {
    expect(parseModdedPathRequest("https://example.com/x")).toBeNull();
    expect(parseModdedPathRequest("map://paths/KUN")).toBeNull();
    expect(parseModdedPathRequest("")).toBeNull();
  });
});

describe("isUsablePath", () => {
  it("accepts >=2 finite [lon,lat] points", () => {
    expect(
      isUsablePath([
        [1, 2],
        [3, 4],
      ]),
    ).toBe(true);
  });

  it("rejects short, non-array, or non-finite coordinates", () => {
    expect(isUsablePath([[1, 2]])).toBe(false);
    expect(isUsablePath(null)).toBe(false);
    expect(isUsablePath("nope")).toBe(false);
    expect(
      isUsablePath([
        [1, 2],
        [NaN, 4],
      ]),
    ).toBe(false);
  });
});

describe("urlFromFetchInput", () => {
  it("extracts the url from string, URL, and Request-like inputs", () => {
    expect(urlFromFetchInput("map://paths/A/b")).toBe("map://paths/A/b");
    expect(urlFromFetchInput(new URL("https://example.com/x"))).toBe(
      "https://example.com/x",
    );
    expect(urlFromFetchInput({ url: "map://paths/A/b" })).toBe(
      "map://paths/A/b",
    );
    expect(urlFromFetchInput(null)).toBe("");
  });
});
