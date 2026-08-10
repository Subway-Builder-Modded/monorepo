import { afterEach, describe, expect, it, vi } from "vitest";
import {
  installDrivingPathServer,
  parseModdedPathRequest,
  urlFromFetchInput,
} from "./driving-path.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

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

describe("installDrivingPathServer", () => {
  it("forwards matching modded path requests to the path server", async () => {
    const fetchMock = vi.fn(async () => new Response('{"coordinates":[]}'));
    globalThis.fetch = fetchMock;

    installDrivingPathServer({
      drivingPathPort: 4321,
      places: [{ code: "KUN" }],
    });

    await globalThis.fetch("map://paths/KUN/pop-42");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:4321/path?cityCode=KUN&popId=pop-42",
      undefined,
    );
  });

  it("passes through non-matching requests unchanged", async () => {
    const fetchMock = vi.fn(async () => new Response("ok"));
    globalThis.fetch = fetchMock;

    installDrivingPathServer({
      drivingPathPort: 4321,
      places: [{ code: "KUN" }],
    });

    await globalThis.fetch("map://paths/OTHER/pop-42");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("map://paths/OTHER/pop-42", undefined);
  });
});
