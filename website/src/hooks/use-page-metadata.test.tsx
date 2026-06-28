import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePageMetadata } from "@/hooks/use-page-metadata";

function PageMetadataProbe({ pathname }: { pathname: string }) {
  usePageMetadata({ pathname });
  return null;
}

function findMeta(attr: "name" | "property", key: string): HTMLMetaElement | null {
  return document.head.querySelector(`meta[${attr}="${key}"]`);
}

describe("usePageMetadata", () => {
  it("uses unsuited title format and default logo for general pages", () => {
    render(<PageMetadataProbe pathname="/community" />);

    expect(document.title).toBe("Community");
    expect(findMeta("property", "og:title")?.content).toBe("Community");
    expect(findMeta("property", "og:image")?.content).toContain("/logo.svg");
    expect(findMeta("name", "theme-color")?.content).toBe("#ffffff");
  });

  it("updates browser and social metadata for cache-backed registry pages", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          name: "South Florida",
          description: "# South Florida\n\nA detailed map of South Florida.",
          gallery: ["gallery/preview.webp"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    try {
      render(<PageMetadataProbe pathname="/registry/maps/south-florida/analytics" />);

      await waitFor(() => {
        expect(document.title).toBe("South Florida | Registry");
      });
      expect(findMeta("property", "og:title")?.content).toBe("South Florida | Registry");
      expect(findMeta("name", "description")?.content).toBe(
        "South Florida A detailed map of South Florida.",
      );
      expect(findMeta("property", "og:image")?.content).toContain(
        "/registry-cache/maps/south-florida/gallery/preview.webp",
      );
      expect(findMeta("name", "theme-color")?.content).toBe("#c77dff");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
