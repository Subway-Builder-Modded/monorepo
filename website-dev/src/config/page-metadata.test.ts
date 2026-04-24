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

  it("resolves updates homepage metadata from shared updates identity", () => {
    const metadata = resolvePageMetadata("/railyard/updates");

    expect(metadata.title).toBe("Updates");
    expect(metadata.pageTitle).toBe("Updates | Railyard");
    expect(metadata.suite.id).toBe("railyard");
  });

  it("resolves updates article metadata from update frontmatter", () => {
    const metadata = resolvePageMetadata("/template-mod/updates/v1.0.0");

    expect(metadata.title).toBe("Template Mod - v1.0.0");
    expect(metadata.pageTitle).toBe("Template Mod - v1.0.0 | Template Mod Updates");
    expect(metadata.suite.id).toBe("template-mod");
  });
});
