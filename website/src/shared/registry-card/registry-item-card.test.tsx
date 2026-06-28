import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Package } from "lucide-react";
import { RegistryItemCard, type RegistryCardData } from "./registry-item-card";
import type { RegistryTypeConfig } from "./registry-item-types";

vi.mock("@/lib/router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const TYPE_CONFIG: RegistryTypeConfig = {
  id: "maps",
  label: "Map",
  pluralLabel: "Maps",
  routeSegment: "maps",
  icon: Package,
  accentLight: "#2563eb",
  accentDark: "#60a5fa",
};

const BASE_CARD: RegistryCardData = {
  id: "asset-a",
  href: "/registry/maps/asset-a",
  title: "Asset A",
  author: "Author A",
  authorId: "author-a",
  description: "A synthetic asset used for component coverage.",
  thumbnailSrc: "/registry-cache/maps/asset-a/preview.webp",
  totalDownloads: 1234,
  tags: ["tag-a", "country:AA"],
  cityCode: "AAA",
  countryCode: "AA",
  countryName: "Country A",
  countryEmoji: null,
  population: 500000,
};

describe("RegistryItemCard", () => {
  it("renders grid card title, author, type, and visible tags", () => {
    render(<RegistryItemCard data={BASE_CARD} typeConfig={TYPE_CONFIG} />);

    expect(screen.getByRole("link", { name: "Open Asset A" })).toHaveAttribute(
      "href",
      "/registry/maps/asset-a",
    );
    expect(screen.getByRole("heading", { name: "Asset A" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Author A" })).toHaveAttribute(
      "href",
      "/registry/authors/author-a",
    );
    expect(screen.getByRole("link", { name: "tag-a" })).toHaveAttribute(
      "href",
      "/registry/maps?tags=tag-a",
    );
    expect(screen.queryByRole("link", { name: "country:AA" })).not.toBeInTheDocument();
  });

  it("renders map metadata in full layout", () => {
    render(<RegistryItemCard data={BASE_CARD} typeConfig={TYPE_CONFIG} variant="full" />);

    expect(screen.getByText("AAA")).toBeInTheDocument();
    expect(screen.getByText("AA")).toBeInTheDocument();
    expect(screen.getByText("500,000")).toBeInTheDocument();
  });

  it("renders contributors when author is hidden", () => {
    render(
      <RegistryItemCard
        data={{
          ...BASE_CARD,
          contributors: [{ authorId: "author-b", authorLabel: "Author B" }],
        }}
        typeConfig={TYPE_CONFIG}
        variant="list"
        hideAuthor={true}
      />,
    );

    expect(screen.queryByRole("link", { name: "Author A" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Author B/ })).toHaveAttribute(
      "href",
      "/registry/authors/author-b",
    );
  });
});
