import { describe, expect, it } from "vitest";
import { formatRegistryDate } from "@/features/registry/detail/lib/format-registry-date";

describe("formatRegistryDate", () => {
  it("formats valid date", () => {
    expect(formatRegistryDate("2026-04-26T00:00:00.000Z")).toBe("Apr 26, 2026");
  });

  it("returns em dash for missing date", () => {
    expect(formatRegistryDate(undefined)).toBe("\u2014");
    expect(formatRegistryDate(null)).toBe("\u2014");
    expect(formatRegistryDate("")).toBe("\u2014");
  });

  it("returns em dash for invalid date", () => {
    expect(formatRegistryDate("not-a-date")).toBe("\u2014");
  });
});
