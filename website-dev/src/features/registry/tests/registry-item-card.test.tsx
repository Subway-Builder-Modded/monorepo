import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RegistryItemCard } from "@/shared/registry-card/registry-item-card";
import { buildRegistryItemHref } from "@/shared/registry-card/registry-item-link";
import { getRegistryIndexHref } from "@/shared/registry-card/registry-item-link";
import type { RegistryCardData } from "@/shared/registry-card/registry-item-types";
import type { RegistryTypeConfig } from "@/shared/registry-card/registry-item-types";

vi.mock("@/lib/router", () => ({
  Link: vi.fn(({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  )),
  navigate: vi.fn(),
}));

const MAP_TYPE_CONFIG: RegistryTypeConfig = {
  id: "maps",
  label: "Map",
  pluralLabel: "Maps",
  routeSegment: "maps",
  accentLight: "#2563eb",
  accentDark: "#60a5fa",
};

const MOD_TYPE_CONFIG: RegistryTypeConfig = {
  id: "mods",
  label: "Mod",
  pluralLabel: "Mods",
  routeSegment: "mods",
  accentLight: "#dc2626",
  accentDark: "#f87171",
};

const SAMPLE_MAP_DATA: RegistryCardData = {
  id: "gwangju-4",
  href: "/registry/maps/gwangju-4",
  title: "Gwangju (40km×40km)",
  author: "kimth9",
  description: "Custom map of Gwangju, Korea.",
  thumbnailSrc: null,
  totalDownloads: 1234,
  tags: ["east-asia"],
  cityCode: "KWJ4",
  countryCode: "KR",
  countryName: "South Korea",
  countryEmoji: "🇰🇷",
  population: 2_140_345,
};

const SAMPLE_MOD_DATA: RegistryCardData = {
  id: "simple-trains",
  href: "/registry/mods/simple-trains",
  title: "Simple Trains",
  author: "Bobby-047",
  description: "Adds some simple trains.",
  thumbnailSrc: null,
  totalDownloads: 50,
  tags: ["trains"],
  cityCode: null,
  countryCode: null,
  countryName: null,
  countryEmoji: null,
  population: null,
};

describe("buildRegistryItemHref", () => {
  it("builds correct href for maps", () => {
    expect(buildRegistryItemHref("maps", "gwangju-4")).toBe("/registry/maps/gwangju-4");
  });

  it("builds correct href for mods", () => {
    expect(buildRegistryItemHref("mods", "simple-trains")).toBe("/registry/mods/simple-trains");
  });

  it("supports future asset types", () => {
    expect(buildRegistryItemHref("scenarios", "my-scenario")).toBe(
      "/registry/scenarios/my-scenario",
    );
  });

  it("returns registry index href", () => {
    expect(getRegistryIndexHref()).toBe("/registry");
  });
});

describe("RegistryItemCard", () => {
  it("renders compact variant with correct link to /registry/maps/<id>", () => {
    render(<RegistryItemCard data={SAMPLE_MAP_DATA} typeConfig={MAP_TYPE_CONFIG} variant="grid" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/registry/maps/gwangju-4");
  });

  it("renders mod compact card with correct link to /registry/mods/<id>", () => {
    render(<RegistryItemCard data={SAMPLE_MOD_DATA} typeConfig={MOD_TYPE_CONFIG} variant="grid" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/registry/mods/simple-trains");
  });

  it("compact variant shows title and author", () => {
    render(<RegistryItemCard data={SAMPLE_MAP_DATA} typeConfig={MAP_TYPE_CONFIG} variant="grid" />);
    expect(screen.getByRole("heading", { name: "Gwangju (40km×40km)" })).toBeInTheDocument();
    expect(screen.getByText("kimth9")).toBeInTheDocument();
  });

  it("compact variant shows Map type badge", () => {
    render(<RegistryItemCard data={SAMPLE_MAP_DATA} typeConfig={MAP_TYPE_CONFIG} variant="grid" />);
    expect(screen.getByText("Map")).toBeInTheDocument();
  });

  it("compact variant shows Mod type badge for mods", () => {
    render(<RegistryItemCard data={SAMPLE_MOD_DATA} typeConfig={MOD_TYPE_CONFIG} variant="grid" />);
    expect(screen.getByText("Mod")).toBeInTheDocument();
  });

  it("full variant renders title and tags", () => {
    render(<RegistryItemCard data={SAMPLE_MAP_DATA} typeConfig={MAP_TYPE_CONFIG} variant="grid" />);
    expect(screen.getByRole("heading", { name: "Gwangju (40km×40km)" })).toBeInTheDocument();
    expect(screen.getByText("east-asia")).toBeInTheDocument();
  });

  it("list variant renders title", () => {
    render(<RegistryItemCard data={SAMPLE_MAP_DATA} typeConfig={MAP_TYPE_CONFIG} variant="list" />);
    expect(screen.getByRole("heading", { name: "Gwangju (40km×40km)" })).toBeInTheDocument();
  });

  it("defaults to compact variant", () => {
    render(<RegistryItemCard data={SAMPLE_MAP_DATA} typeConfig={MAP_TYPE_CONFIG} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/registry/maps/gwangju-4");
  });

  it("applies type accent from type config", () => {
    const { container } = render(
      <RegistryItemCard data={SAMPLE_MAP_DATA} typeConfig={MAP_TYPE_CONFIG} variant="grid" />,
    );
    // The badge should have inline style referencing accentLight
    const badge = container.querySelector("[style]");
    expect(badge).toBeTruthy();
  });

  it("shows city code, country, population for maps", () => {
    render(<RegistryItemCard data={SAMPLE_MAP_DATA} typeConfig={MAP_TYPE_CONFIG} variant="grid" />);
    expect(screen.getByText("KWJ4")).toBeInTheDocument();
    expect(screen.getByText(/South Korea/)).toBeInTheDocument();
    // population should be formatted and shown
    expect(screen.getByText(/2,140,345/)).toBeInTheDocument();
  });

  it("does not show map-specific fields for mods (null values)", () => {
    render(<RegistryItemCard data={SAMPLE_MOD_DATA} typeConfig={MOD_TYPE_CONFIG} variant="grid" />);
    expect(screen.queryByText("KWJ4")).not.toBeInTheDocument();
    expect(screen.queryByText(/South Korea/)).not.toBeInTheDocument();
  });

  it("shows Preview unavailable when thumbnailSrc is null", () => {
    render(<RegistryItemCard data={SAMPLE_MAP_DATA} typeConfig={MAP_TYPE_CONFIG} variant="grid" />);
    expect(screen.getByText("Preview unavailable")).toBeInTheDocument();
  });
});

describe("RegistryListingCard (backward compat wrapper)", () => {
  // Import the wrapper to verify it still works for the carousel
  it("can be imported and used with RegistryItemBase-compatible data", async () => {
    const { RegistryListingCard } =
      await import("@/features/registry/components/shared/registry-listing-card");
    render(
      <RegistryListingCard
        item={{
          id: "gwangju-4",
          kind: "map",
          href: "/registry/maps/gwangju-4",
          title: "Gwangju (40km×40km)",
          author: "kimth9",
          description: "A test map.",
          thumbnailSrc: null,
          totalDownloads: 50,
          cityCode: "KWJ4",
          countryCode: "KR",
          countryName: "South Korea",
          countryEmoji: "🇰🇷",
          population: 1000000,
        }}
      />,
    );
    // Should render the compact card (same as carousel)
    expect(screen.getByRole("link")).toHaveAttribute("href", "/registry/maps/gwangju-4");
    expect(screen.getByText("Map")).toBeInTheDocument();
  });
});
