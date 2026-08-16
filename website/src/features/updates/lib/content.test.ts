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

    // Compared numerically per segment rather than lexicographically: string
    // ordering ranks v0.2.9 above v0.2.10, so a text sort would assert the
    // wrong order the moment a version reaches two digits.
    const toSegments = (id: string) => id.replace(/^v/, "").split(".").map(Number);
    const ids = entries.map((entry) => entry.id);

    for (let index = 1; index < ids.length; index += 1) {
      const previous = toSegments(ids[index - 1]);
      const current = toSegments(ids[index]);
      expect(previous.length).toBe(current.length);
      const firstDifference = previous.findIndex(
        (segment, position) => segment !== current[position],
      );
      if (firstDifference !== -1) {
        expect(previous[firstDifference]).toBeGreaterThan(current[firstDifference]);
      }
    }
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
