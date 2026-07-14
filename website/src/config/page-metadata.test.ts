import { describe, expect, it } from "vitest";
import { resolvePageMetadata, resolvePageMetadataAsync } from "@/config/page-metadata";

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
    expect(metadata.imagePath).toBe("/images/embeds/railyard.svg");
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
    expect(metadata.imagePath).toBe("/images/embeds/registry.svg");
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
    expect(metadata.pageTitle).toBe("v1.0.0 | Template Mod");
    expect(metadata.description).toBe("v1.0.0 changelog and release notes for Template Mod.");
    expect(metadata.suite.id).toBe("template-mod");
  });

  it("resolves documentation article metadata without adding a docs suffix", () => {
    const metadata = resolvePageMetadata("/registry/docs/author-attribution");

    expect(metadata.pageTitle).toBe("Author Attribution | Registry");
    expect(metadata.description).toMatch(/attribution/i);
  });

  it("resolves registry listing metadata from the cache manifest", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          name: "South Florida",
          description: "# South Florida\n\nA detailed map of South Florida for Subway Builder.",
          gallery: [
            "https://raw.githubusercontent.com/Subway-Builder-Modded/registry/abc123/maps/south-florida/gallery/preview.webp",
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    try {
      const metadata = await resolvePageMetadataAsync("/registry/maps/south-florida/analytics");

      expect(metadata.title).toBe("South Florida");
      expect(metadata.pageTitle).toBe("South Florida | Registry");
      expect(metadata.description).toBe(
        "South Florida A detailed map of South Florida for Subway Builder.",
      );
      expect(metadata.imagePath).toBe(
        "https://raw.githubusercontent.com/Subway-Builder-Modded/registry/abc123/maps/south-florida/gallery/preview.webp",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("resolves registry author and project metadata from the authors index", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          authors: [{ author_id: "ahkimn", author_alias: "Yukina-" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    try {
      const authorMetadata = await resolvePageMetadataAsync("/registry/authors/ahkimn");
      const projectMetadata = await resolvePageMetadataAsync(
        "/registry/authors/ahkimn/subwaybuilder-jp-maps/analytics",
      );

      expect(authorMetadata.pageTitle).toBe("Yukina- | Registry");
      expect(authorMetadata.description).toBe(
        "View the Registry statistics, analytics, and listings for Yukina-.",
      );
      expect(projectMetadata.pageTitle).toBe("subwaybuilder-jp-maps | Registry");
      expect(projectMetadata.description).toBe(
        "View the Registry statistics, analytics, and listings for subwaybuilder-jp-maps.",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
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
    expect(metadata.imagePath).toBe("/images/embeds/registry.svg");
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

  it("resolves /contribute metadata from navigation config", () => {
    const metadata = resolvePageMetadata("/contribute");

    expect(metadata.title).toBe("Contribute");
    expect(metadata.pageTitle).toBe("Contribute");
    expect(metadata.suite.id).toBe("general");
  });
});
