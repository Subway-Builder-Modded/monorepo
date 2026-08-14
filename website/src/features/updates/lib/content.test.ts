import { describe, expect, it } from "vitest";
import {
  findUpdateEntry,
  getUpdateEditUrl,
  getUpdateSourcePath,
  getUpdatesEntries,
} from "@/features/updates/lib/content";

describe("updates content", () => {
  it("returns updates entries sorted newest first", () => {
    const entries = getUpdatesEntries("railyard");
    expect(entries.length).toBeGreaterThan(0);

    // Ordering is semver-aware, not lexicographic: a string sort ranks v0.2.9
    // above v0.2.10, which is why the expectation is not built with localeCompare.
    const ids = entries.map((entry) => entry.id);
    expect(ids.indexOf("v0.2.10")).toBeLessThan(ids.indexOf("v0.2.9"));
    expect(ids.indexOf("v0.2.9")).toBeLessThan(ids.indexOf("v0.1.6"));
  });

  it("finds update by suite and id", () => {
    const entry = findUpdateEntry("template-mod", "v1.0.0");
    expect(entry).not.toBeNull();
    expect(entry?.routePath).toBe("/template-mod/updates/v1.0.0");
  });

  it("builds canonical source path", () => {
    expect(getUpdateSourcePath("website", "v2.0.0")).toBe("/content/website/updates/v2.0.0.mdx");
  });

  it("builds the GitHub source URL for updates", () => {
    expect(getUpdateEditUrl("railyard", "v0.2.6")).toBe(
      "ttps://github.com/Subway-Builder-Modded/monorepo/edit/website-dev/website/content/railyard/updates/v0.2.6.mdx",
    );
  });
});
