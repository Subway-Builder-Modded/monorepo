import { render } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { usePageMetadata } from "@/app/hooks/use-page-metadata";

function PageMetadataProbe({ pathname }: { pathname: string }) {
  usePageMetadata({ pathname });
  return null;
}

function findMeta(attr: "name" | "property", key: string): HTMLMetaElement | null {
  return document.head.querySelector(`meta[${attr}="${key}"]`);
}

describe("usePageMetadata", () => {
  it("writes title, description, Open Graph and Twitter tags from unified metadata", () => {
    render(<PageMetadataProbe pathname="/registry/trending" />);

    expect(document.title).toBe("Trending | Registry");
    expect(findMeta("name", "description")?.content).toMatch(/trending content/i);
    expect(findMeta("property", "og:title")?.content).toBe("Trending | Registry");
    expect(findMeta("property", "og:description")?.content).toMatch(/trending content/i);
    expect(findMeta("name", "twitter:title")?.content).toBe("Trending | Registry");
    expect(findMeta("name", "twitter:card")?.content).toBe("summary_large_image");
    expect(findMeta("property", "og:image")?.content).toContain("/images/registry/logo.png");
    expect(findMeta("name", "twitter:image")?.content).toContain("/images/registry/logo.png");
    expect(document.head.querySelector("link[rel=canonical]")?.getAttribute("href")).toContain(
      "/registry/trending",
    );
  });

  it("uses unsuited title format and default logo for general pages", () => {
    render(<PageMetadataProbe pathname="/community" />);

    expect(document.title).toBe("Community");
    expect(findMeta("property", "og:title")?.content).toBe("Community");
    expect(findMeta("property", "og:image")?.content).toContain("/logo.svg");
  });
});
