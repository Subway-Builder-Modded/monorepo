import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getListingVersionCreditsKey,
  loadListingVersionCredits,
  parseListingVersionCredits,
} from "@/features/registry/lib/load-listing-version-credits";

const PORTO_SHAPED_CSV = [
  "listing_type,listing_id,version,credited_author_id",
  "map,opo-pt-metropolitan,v0.1.1,bquelhas",
  "map,opo-pt-metropolitan,v0.2.0,bquelhas",
  "map,opo-pt-metropolitan,v0.2.1,bquelhas",
  "map,opo-pt-metropolitan,v0.3.0,Capitao-piolho",
  "map,opo-pt-metropolitan,v0.4.2,Capitao-piolho",
  "map,vancouver,1.0.1,devenperez",
  "mod,example-mod,v1.0.0,someone",
].join("\n");

function mockFetchResponse(response: { ok: boolean; status: number; text: string }) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: response.ok,
      status: response.status,
      text: async () => response.text,
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseListingVersionCredits", () => {
  it("parses porto-shaped split credits into per-listing and per-author views", () => {
    const credits = parseListingVersionCredits(PORTO_SHAPED_CSV);

    expect(credits).not.toBeNull();
    const portoKey = getListingVersionCreditsKey("map", "opo-pt-metropolitan");
    expect(credits!.creditsByListing.get(portoKey)?.get("v0.2.1")).toBe("bquelhas");
    expect(credits!.creditsByListing.get(portoKey)?.get("v0.3.0")).toBe("Capitao-piolho");
    expect(
      credits!.creditsByListing.get(getListingVersionCreditsKey("map", "vancouver"))?.get("1.0.1"),
    ).toBe("devenperez");

    const caretakerCredits = credits!.creditsByAuthor.get("capitao-piolho");
    expect(caretakerCredits?.get(portoKey)).toEqual(new Set(["v0.3.0", "v0.4.2"]));
    const originalAuthorCredits = credits!.creditsByAuthor.get("bquelhas");
    expect(originalAuthorCredits?.get(portoKey)).toEqual(new Set(["v0.1.1", "v0.2.0", "v0.2.1"]));
    expect(
      credits!.creditsByAuthor
        .get("someone")
        ?.has(getListingVersionCreditsKey("mod", "example-mod")),
    ).toBe(true);
  });

  it("returns null for header-only or empty text", () => {
    expect(parseListingVersionCredits("")).toBeNull();
    expect(
      parseListingVersionCredits("listing_type,listing_id,version,credited_author_id\n"),
    ).toBeNull();
  });

  it("returns null when required columns are missing", () => {
    expect(
      parseListingVersionCredits("listing_type,listing_id,version\nmap,foo,v1.0.0"),
    ).toBeNull();
  });

  it("skips rows with blank fields", () => {
    const credits = parseListingVersionCredits(
      [
        "listing_type,listing_id,version,credited_author_id",
        "map,foo,v1.0.0,alice",
        "map,,v1.0.0,alice",
        "map,foo,,alice",
        "map,foo,v2.0.0,",
      ].join("\n"),
    );

    expect(credits).not.toBeNull();
    expect(credits!.creditsByListing.get(getListingVersionCreditsKey("map", "foo"))).toEqual(
      new Map([["v1.0.0", "alice"]]),
    );
  });
});

describe("loadListingVersionCredits", () => {
  it("loads and parses the credits artifact from the registry cache", async () => {
    mockFetchResponse({ ok: true, status: 200, text: PORTO_SHAPED_CSV });

    const credits = await loadListingVersionCredits();

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "/registry-cache/analytics/listing_version_credits.csv",
    );
    expect(credits?.creditsByListing.size).toBe(3);
  });

  it("returns null when the artifact is missing", async () => {
    mockFetchResponse({ ok: false, status: 404, text: "" });

    expect(await loadListingVersionCredits()).toBeNull();
  });

  it("returns null when the fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    expect(await loadListingVersionCredits()).toBeNull();
  });
});
