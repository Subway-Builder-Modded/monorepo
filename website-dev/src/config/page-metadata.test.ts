import { describe, expect, it } from "vitest";
import { resolvePageMetadata } from "@/config/page-metadata";

describe("resolvePageMetadata", () => {
  it("returns unsuited homepage metadata with default logo", () => {
    const metadata = resolvePageMetadata("/");

    expect(metadata.title).toBe("Subway Builder Modded");
    expect(metadata.pageTitle).toBe("Subway Builder Modded");
    expect(metadata.suite.id).toBe("general");
    expect(metadata.imagePath).toBe("/logo.svg");
  });

  it("derives suite page metadata and suite logo path from navigation config", () => {
    const metadata = resolvePageMetadata("/railyard/analytics");

    expect(metadata.title).toBe("Analytics");
    expect(metadata.pageTitle).toBe("Analytics | Railyard");
    expect(metadata.description).toMatch(/download analytics/i);
    expect(metadata.suite.id).toBe("railyard");
    expect(metadata.imagePath).toBe("/images/railyard/logo.png");
  });

  it("falls back to suite home metadata for unmatched suite routes", () => {
    const metadata = resolvePageMetadata("/registry/unknown/route");

    expect(metadata.title).toBe("Home");
    expect(metadata.pageTitle).toBe("Home | Registry");
    expect(metadata.suite.id).toBe("registry");
    expect(metadata.imagePath).toBe("/images/registry/logo.png");
  });
});
