import { describe, expect, it } from "vitest";

import {
  COUNTRY_TO_LOCATION,
  DATA_QUALITY_TIERS,
  DeprecationSchema,
  LocationTagSchema,
} from "@subway-builder-modded/registry-schemas";

import {
  DATA_QUALITY_TIER_VALUES,
  LOCATION_TAGS,
} from "../../packages/config/src/asset-listings/map-filter-values";
import { REGIONS } from "../../website/src/features/docs/mdx/region-tags-data";

// The app and website deliberately re-declare registry vocabulary instead of
// importing the schemas package at runtime (see map-filter-values.ts). These
// tests are the drift guard: they compare each re-declaration against the
// published @subway-builder-modded/registry-schemas package, which tracks
// `latest` so a registry-side change fails the scheduled run too.

describe("location tag vocabulary (packages/config)", () => {
  it("matches the registry LocationTagSchema exactly", () => {
    expect([...LOCATION_TAGS]).toEqual([...LocationTagSchema.options]);
  });
});

describe("data-quality tier vocabulary (packages/config)", () => {
  it("matches the registry DATA_QUALITY_TIERS exactly, order included", () => {
    expect([...DATA_QUALITY_TIER_VALUES]).toEqual([...DATA_QUALITY_TIERS]);
  });
});

describe("website region-tags reference (website docs)", () => {
  it("uses only registry location tags as region ids, without duplicates", () => {
    const ids = REGIONS.map((region) => region.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(LocationTagSchema.options).toContain(id);
    }
  });

  it("lists no country under more than one region", () => {
    const codes = REGIONS.flatMap((region) => region.countries.map((c) => c.code));
    const duplicates = codes.filter((code, i) => codes.indexOf(code) !== i);
    expect(duplicates).toEqual([]);
  });

  it("places every listed country in the region the registry derives from its code", () => {
    const misplaced = REGIONS.flatMap((region) =>
      region.countries
        .filter((country) => COUNTRY_TO_LOCATION[country.code] !== region.id)
        .map((country) => ({
          country: country.name,
          code: country.code,
          website: region.id,
          registry: COUNTRY_TO_LOCATION[country.code] ?? "<unmapped>",
        })),
    );
    expect(misplaced).toEqual([]);
  });
});

describe("deprecation record shape (website + app re-declarations)", () => {
  // The website and app re-declare the deprecation block shape as TS/Go
  // literals; this guards the field vocabulary against registry drift.
  it("matches the fields the clients re-declare, including the deleted flag", () => {
    const shape = DeprecationSchema.shape as Record<string, unknown>;
    expect(Object.keys(shape).sort()).toEqual(["by_github_id", "deleted", "reason", "since"]);
  });

  it("treats deleted as an optional true-only flag (absent = reversible deprecation)", () => {
    const base = { since: "2026-08-01T00:00:00Z", by_github_id: 1 };
    expect(DeprecationSchema.safeParse(base).success).toBe(true);
    expect(DeprecationSchema.safeParse({ ...base, deleted: true }).success).toBe(true);
    expect(DeprecationSchema.safeParse({ ...base, deleted: false }).success).toBe(false);
  });
});
