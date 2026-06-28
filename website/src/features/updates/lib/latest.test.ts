import { describe, expect, it } from "vitest";
import { findLatestBadgeEntry } from "./latest";

describe("findLatestBadgeEntry", () => {
  it("skips release candidates when choosing the latest badge entry", () => {
    const latest = findLatestBadgeEntry([
      { id: "v0.2.4/rc.4", frontmatter: { tag: "release-candidate" } },
      { id: "v0.2.3", frontmatter: { tag: "release" } },
    ]);

    expect(latest?.id).toBe("v0.2.3");
  });

  it("returns null when every entry is a release candidate", () => {
    const latest = findLatestBadgeEntry([
      { id: "v0.2.4/rc.4", frontmatter: { tag: "release-candidate" } },
      { id: "v0.2.4/rc.3", frontmatter: { tag: "release-candidate" } },
    ]);

    expect(latest).toBeNull();
  });
});
