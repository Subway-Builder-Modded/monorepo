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

  it("resolves /railyard homepage metadata from the site navigation config", () => {
    const metadata = resolvePageMetadata("/railyard");

    expect(metadata.title).toBe("Railyard");
    expect(metadata.pageTitle).toBe("Railyard");
    expect(metadata.description).toBe(
      "Discover the all-in-one manager for Subway Builder community-made content.",
    );
    expect(metadata.suite.id).toBe("railyard");
  });

  it("resolves /template-mod homepage metadata from the site navigation config", () => {
    const metadata = resolvePageMetadata("/template-mod");

    expect(metadata.title).toBe("Template Mod");
    expect(metadata.pageTitle).toBe("Template Mod");
    expect(metadata.description).toBe(
      "Discover the all-inclusive TypeScript template for creating Subway Builder mods with ease.",
    );
    expect(metadata.suite.id).toBe("template-mod");
  });

  it("resolves /depot homepage metadata from the site navigation config", () => {
    const metadata = resolvePageMetadata("/depot");

    expect(metadata.title).toBe("Depot");
    expect(metadata.pageTitle).toBe("Depot");
    expect(metadata.description).toBe(
      "Discover the core Python library powering the Subway Builder Modded map creation ecosystem.",
    );
    expect(metadata.suite.id).toBe("depot");
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
    expect(metadata.description).toBe(
      "View the changelogs and release notes for the Railyard app.",
    );
    expect(metadata.suite.id).toBe("railyard");
  });

  it("resolves updates article metadata from update frontmatter", () => {
    const metadata = resolvePageMetadata("/template-mod/updates/v1.0.0");

    expect(metadata.title).toBe("v1.0.0");
    expect(metadata.pageTitle).toBe("v1.0.0 | Template Mod Updates");
    expect(metadata.suite.id).toBe("template-mod");
  });

  it("resolves /license page metadata from navigation config", () => {
    const metadata = resolvePageMetadata("/license");

    expect(metadata.title).toBe("License");
    expect(metadata.pageTitle).toBe("License");
    expect(metadata.description).toBe(
      "Terms and licensing information for Subway Builder Modded projects.",
    );
    expect(metadata.suite.id).toBe("general");
    expect(metadata.imagePath).toBe("/logo.svg");
  });

  it("resolves /credits page metadata from navigation config", () => {
    const metadata = resolvePageMetadata("/credits");

    expect(metadata.title).toBe("Credits");
    expect(metadata.pageTitle).toBe("Credits");
    expect(metadata.description).toBe(
      "The maintainers and contributors helping Subway Builder Modded move forward.",
    );
    expect(metadata.suite.id).toBe("general");
    expect(metadata.imagePath).toBe("/logo.svg");
  });

  it("resolves /community page metadata from navigation config", () => {
    const metadata = resolvePageMetadata("/community");

    expect(metadata.title).toBe("Community");
    expect(metadata.pageTitle).toBe("Community");
    expect(metadata.description).toBe(
      "Join the Subway Builder Modded Discord, follow project activity, and see how the community is growing.",
    );
    expect(metadata.suite.id).toBe("general");
    expect(metadata.imagePath).toBe("/logo.svg");
  });

  it("resolves registry markdown playground metadata from site navigation identity", () => {
    const metadata = resolvePageMetadata("/registry/markdown-playground");

    expect(metadata.title).toBe("Playground");
    expect(metadata.description).toBe(
      "Experiment with Markdown content in a live preview environment.",
    );
    expect(metadata.pageTitle).toBe("Playground | Registry");
    expect(metadata.suite.id).toBe("registry");
    expect(metadata.imagePath).toBe("/images/registry/logo.png");
  });

  it("resolves /railyard/analytics metadata from navigation config", () => {
    const metadata = resolvePageMetadata("/railyard/analytics");

    expect(metadata.title).toBe("Analytics");
    expect(metadata.pageTitle).toBe("Analytics | Railyard");
    expect(metadata.suite.id).toBe("railyard");
  });

  it("resolves /registry/analytics metadata from navigation config", () => {
    const metadata = resolvePageMetadata("/registry/analytics");

    expect(metadata.title).toBe("Analytics");
    expect(metadata.pageTitle).toBe("Analytics | Registry");
    expect(metadata.suite.id).toBe("registry");
  });

  it("resolves /registry/trending metadata from navigation config", () => {
    const metadata = resolvePageMetadata("/registry/trending");

    expect(metadata.title).toBe("Trending");
    expect(metadata.pageTitle).toBe("Trending | Registry");
    expect(metadata.suite.id).toBe("registry");
  });

  it("resolves /contribute metadata from navigation config", () => {
    const metadata = resolvePageMetadata("/contribute");

    expect(metadata.title).toBe("Contribute");
    expect(metadata.pageTitle).toBe("Contribute");
    expect(metadata.suite.id).toBe("general");
  });
});
