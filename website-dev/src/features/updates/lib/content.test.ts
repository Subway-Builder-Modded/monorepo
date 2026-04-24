import { describe, expect, it } from "vitest";
import {
  findUpdateEntry,
  getUpdateSourcePath,
  getUpdatesEntries,
} from "@/features/updates/lib/content";

describe("updates content", () => {
  it("returns updates entries sorted newest first", () => {
    const entries = getUpdatesEntries("railyard");
    expect(entries.length).toBeGreaterThan(0);

    const ids = entries.map((entry) => entry.id);
    const sortedIds = [...ids].sort((a, b) => b.localeCompare(a));
    expect(ids[0]).toBe(sortedIds[0]);
  });

  it("finds update by suite and id", () => {
    const entry = findUpdateEntry("template-mod", "v1.0.0");
    expect(entry).not.toBeNull();
    expect(entry?.routePath).toBe("/template-mod/updates/v1.0.0");
  });

  it("builds canonical source path", () => {
    expect(getUpdateSourcePath("website", "v2.0.0")).toBe("/content/website/updates/v2.0.0.mdx");
  });
});
