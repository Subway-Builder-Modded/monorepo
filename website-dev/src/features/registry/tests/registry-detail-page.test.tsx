import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegistryDetailPage } from "@/features/registry/detail/registry-detail-page";

const mockLoadRegistryDetail = vi.fn();

vi.mock("@/features/registry/detail/lib/load-registry-detail", () => ({
  loadRegistryDetail: (...args: unknown[]) => mockLoadRegistryDetail(...args),
}));

vi.mock("@/config/site-navigation", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/config/site-navigation")>();
  return {
    ...original,
    getSuiteById: () => ({
      accent: {
        light: "#2563eb",
        dark: "#60a5fa",
        textInvertedLight: "#ffffff",
        textInvertedDark: "#000000",
        mutedLight: "rgba(37,99,235,0.2)",
        mutedDark: "rgba(96,165,250,0.2)",
      },
    }),
  };
});

const MAP_LOADED = {
  typeConfig: {
    id: "maps",
    label: "Map",
    pluralLabel: "Maps",
    routeSegment: "maps",
    accentLight: "#2563eb",
    accentDark: "#60a5fa",
  },
  item: {
    id: "gwangju-4",
    type: "maps",
    routeSegment: "maps",
    name: "Gwangju",
    author: "slurry",
    authorId: "rslurry",
    description: "A modern map.",
    tags: ["east-asia", "metro"],
    thumbnailSrc: null,
    totalDownloads: 1284,
    cityCode: "GZ",
    countryCode: "CN",
    countryName: "China",
    population: 14_000_000,
  },
  manifest: {
    name: "Gwangju",
    description: "# Gwangju\n\nGreat map",
    tags: ["east-asia", "metro"],
    gallery: ["gallery/one.png", "gallery/two.png"],
    source: "https://github.com/example/gwangju",
    update: { type: "github", repo: "example/gwangju" },
  },
  listingVersions: {
    "1.0.0": {
      is_complete: true,
      checked_at: "2026-04-26T00:00:00.000Z",
      source: {
        download_url: "https://downloads.example/gwangju-1.0.0.zip",
      },
    },
    "0.9.0": {
      is_complete: true,
      checked_at: "2026-04-20T00:00:00.000Z",
      source: {
        download_url: "https://downloads.example/gwangju-0.9.0.zip",
      },
    },
  },
  listingLatestSemverVersion: "1.0.0",
  listingLatestSemverComplete: true,
  listingCompleteVersions: ["1.0.0", "0.9.0"],
  versionDownloads: {
    "1.0.0": 102,
    "0.9.0": 25,
  },
  authorAttributionHref: "https://github.com/rslurry",
};

const MOD_LOADED = {
  ...MAP_LOADED,
  typeConfig: {
    id: "mods",
    label: "Mod",
    pluralLabel: "Mods",
    routeSegment: "mods",
    accentLight: "#dc2626",
    accentDark: "#f87171",
  },
  item: {
    ...MAP_LOADED.item,
    id: "example-mod",
    type: "mods",
    routeSegment: "mods",
    name: "Example Mod",
    cityCode: null,
    countryName: null,
    population: null,
  },
  manifest: {
    ...MAP_LOADED.manifest,
    name: "Example Mod",
  },
};

describe("RegistryDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders valid map detail title and metadata", async () => {
    mockLoadRegistryDetail.mockResolvedValue(MAP_LOADED);

    render(<RegistryDetailPage routeSegment="maps" id="gwangju-4" />);

    await waitFor(() => {
      expect(screen.getAllByRole("heading", { name: "Gwangju" }).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("Map").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Source Code").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "slurry" })).toHaveAttribute(
      "href",
      "https://github.com/rslurry",
    );
    expect(screen.getByText("Date Published")).toBeInTheDocument();
    expect(screen.getByText("Date Updated")).toBeInTheDocument();
    expect(screen.getByText("Version Count")).toBeInTheDocument();
    expect(screen.getByText("Tags")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "east-asia" })).toHaveAttribute(
      "href",
      "/registry/maps?tags=east-asia",
    );
    expect(screen.getByRole("link", { name: /Source Code/i })).toHaveAttribute(
      "href",
      "https://github.com/example/gwangju",
    );
  });

  it("renders valid mod detail title and omits map-only fields", async () => {
    mockLoadRegistryDetail.mockResolvedValue(MOD_LOADED);

    render(<RegistryDetailPage routeSegment="mods" id="example-mod" />);

    await waitFor(() => {
      expect(screen.getAllByRole("heading", { name: "Example Mod" }).length).toBeGreaterThan(0);
    });
    expect(screen.queryByText("China")).not.toBeInTheDocument();
    expect(screen.queryByText("Population")).not.toBeInTheDocument();
  });

  it("renders not found for invalid id", async () => {
    mockLoadRegistryDetail.mockResolvedValue(null);

    render(<RegistryDetailPage routeSegment="maps" id="missing" />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    });
  });

  it("renders all five tabs and analytics tab has no placeholder content", async () => {
    mockLoadRegistryDetail.mockResolvedValue(MAP_LOADED);

    render(<RegistryDetailPage routeSegment="maps" id="gwangju-4" />);

    await waitFor(() => {
      expect(screen.getAllByRole("heading", { name: "Gwangju" }).length).toBeGreaterThan(0);
    });

    expect(screen.getByRole("tab", { name: /Description/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Analytics/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Gallery/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Versions/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Map$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Analytics/i }));
    expect(screen.queryByText(/coming soon|placeholder|chart/i)).not.toBeInTheDocument();
  });

  it("opens Download dialog with railyard and direct download actions", async () => {
    mockLoadRegistryDetail.mockResolvedValue(MAP_LOADED);

    render(<RegistryDetailPage routeSegment="maps" id="gwangju-4" />);

    await waitFor(() => {
      expect(screen.getAllByRole("heading", { name: "Gwangju" }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole("button", { name: /^Download$/i })[0]!);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText("Download Gwangju").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Open in Railyard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Download Railyard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Download$/i })).toHaveAttribute(
      "href",
      "https://downloads.example/gwangju-1.0.0.zip",
    );
  });

  it("renders gallery and opens lightbox", async () => {
    mockLoadRegistryDetail.mockResolvedValue(MAP_LOADED);

    render(<RegistryDetailPage routeSegment="maps" id="gwangju-4" />);

    await waitFor(() => {
      expect(screen.getAllByRole("heading", { name: "Gwangju" }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("tab", { name: /Gallery/i }));
    fireEvent.click(screen.getByRole("button", { name: /Open image gallery/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("allows switching to versions tab", async () => {
    mockLoadRegistryDetail.mockResolvedValue(MAP_LOADED);

    render(<RegistryDetailPage routeSegment="maps" id="gwangju-4" />);

    await waitFor(() => {
      expect(screen.getAllByRole("heading", { name: "Gwangju" }).length).toBeGreaterThan(0);
    });

    const versionsTab = screen.getByRole("tab", { name: /Versions/i });
    fireEvent.click(versionsTab);
    expect(versionsTab).toBeInTheDocument();
  });

  it("does not crash when optional fields are missing", async () => {
    mockLoadRegistryDetail.mockResolvedValue({
      ...MOD_LOADED,
      item: {
        ...MOD_LOADED.item,
        description: "",
        tags: [],
      },
      manifest: {
        name: "Example Mod",
      },
      listingVersions: {},
      versionDownloads: {},
      authorAttributionHref: null,
    });

    render(<RegistryDetailPage routeSegment="mods" id="example-mod" />);

    await waitFor(() => {
      expect(screen.getAllByRole("heading", { name: "Example Mod" }).length).toBeGreaterThan(0);
    });
  });
});
