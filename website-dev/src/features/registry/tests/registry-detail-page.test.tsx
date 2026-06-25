import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
    description: "## Gwangju\n\nGreat map",
    tags: ["east-asia", "metro"],
    source_quality: "high",
    level_of_detail: "medium",
    population_count: 2_150_000,
    points_count: 8_934,
    grid_statistics: {
      detail: {
        playableAreaKm2: 5617,
      },
    },
    file_sizes: {
      "gwangju.pmtiles": 18.2,
      "buildings_index.json": 42,
      "demand_data.json": 4.35,
      "ocean_depth_index.json": 2.63,
      "roads.geojson": 11.46,
      "runways_taxiways.geojson": 0,
    },
    gallery: ["gallery/one.png", "gallery/two.png"],
    source: "https://github.com/example/gwangju",
    update: { type: "github", repo: "example/gwangju" },
  },
  listingVersions: {
    "1.0.0": {
      is_complete: true,
      checked_at: "2026-04-26T00:00:00.000Z",
      source: {
        repo: "example/gwangju",
        tag: "v1.0.0",
        download_url: "https://downloads.example/gwangju-1.0.0.zip",
      },
    },
    "0.9.0": {
      is_complete: true,
      checked_at: "2026-04-20T00:00:00.000Z",
      source: {
        repo: "example/gwangju",
        tag: "v0.9.0",
        download_url: "https://downloads.example/gwangju-0.9.0.zip",
      },
    },
  },
  listingLatestSemverVersion: "1.0.0",
  listingLatestSemverComplete: true,
  listingCompleteVersions: ["1.0.0", "0.9.0"],
  versionReleaseDates: {
    "1.0.0": "2026-04-26T00:00:00.000Z",
    "0.9.0": "2026-04-20T00:00:00.000Z",
  },
  versionDownloads: {
    "1.0.0": 102,
    "0.9.0": 25,
  },
  authorAttributionHref: "https://github.com/rslurry",
  collaborators: [{ authorId: "Kronifer", authorLabel: "Kronifer" }],
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

const CUSTOM_MAP_LOADED = {
  ...MAP_LOADED,
  manifest: {
    ...MAP_LOADED.manifest,
    update: {
      type: "custom",
      url: "https://updates.example/gwangju.json",
    },
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
    expect(await screen.findByText("Great map")).toBeInTheDocument();
    expect(screen.getAllByText("Map").length).toBeGreaterThan(0);
    expect(
      screen
        .getAllByRole("link", { name: "Map" })
        .some((link) => link.getAttribute("href") === "/registry/maps"),
    ).toBe(true);
    expect(screen.getAllByText("Source").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "slurry" })).toHaveAttribute(
      "href",
      "/registry/authors/rslurry",
    );
    expect(screen.getByRole("link", { name: "Kronifer" })).toHaveAttribute(
      "href",
      "/registry/authors/Kronifer",
    );
    expect(screen.getAllByText("Date Published").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Date Updated").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Version Count").length).toBeGreaterThan(0);
    expect(screen.getByText("Tags")).toBeInTheDocument();

    const tagsElement = screen.getByText("Tags");
    const sidebarElement = tagsElement.closest("aside");
    expect(sidebarElement).not.toBeNull();
    const sidebar = within(sidebarElement!);

    expect(sidebar.queryByText("Demand Data")).not.toBeInTheDocument();
    expect(screen.getAllByText("Data Quality").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Level of Detail").length).toBeGreaterThan(0);
    expect(screen.getAllByText("High").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Medium").length).toBeGreaterThan(0);
    expect(sidebar.queryByText("File Sizes")).not.toBeInTheDocument();
    expect(sidebar.queryByText("PMTiles")).not.toBeInTheDocument();
    expect(sidebar.queryByText("Buildings Index")).not.toBeInTheDocument();
    expect(sidebar.queryByText("Ocean Depth Index")).not.toBeInTheDocument();
    expect(sidebar.queryByText("Runways & Taxiways")).not.toBeInTheDocument();
    expect(screen.getByTestId("map-basemap-background")).toHaveAttribute(
      "src",
      "/registry-cache/maps/gwangju-4/basemap.svg",
    );
    expect(screen.getByRole("link", { name: "east-asia" })).toHaveAttribute(
      "href",
      "/registry/maps?tags=east-asia",
    );
    expect(screen.getByRole("link", { name: /^Source$/i })).toHaveAttribute(
      "href",
      "https://github.com/example/gwangju",
    );
  }, 20_000);

  it("renders valid mod detail title and omits map-only fields", async () => {
    mockLoadRegistryDetail.mockResolvedValue(MOD_LOADED);

    render(<RegistryDetailPage routeSegment="mods" id="example-mod" />);

    await waitFor(() => {
      expect(screen.getAllByRole("heading", { name: "Example Mod" }).length).toBeGreaterThan(0);
    });
    expect(
      screen
        .getAllByRole("link", { name: "Mod" })
        .some((link) => link.getAttribute("href") === "/registry/mods"),
    ).toBe(true);
    expect(screen.queryByText("China")).not.toBeInTheDocument();
    expect(screen.queryByText("Population")).not.toBeInTheDocument();
    expect(screen.queryByTestId("map-basemap-background")).not.toBeInTheDocument();
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
    expect(screen.getByRole("tab", { name: /Details/i })).toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: /Close gallery/i })).toBeInTheDocument();
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

  it("renders version changelog view when version subroute is provided", async () => {
    mockLoadRegistryDetail.mockResolvedValue(MAP_LOADED);

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ body: "## Changelog\n\n- Added sample entry." }), {
        status: 200,
      }),
    );

    render(
      <RegistryDetailPage routeSegment="maps" id="gwangju-4" tabId="versions" versionId="1.0.0" />,
    );

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Versions" })).toHaveAttribute(
        "href",
        "/registry/maps/gwangju-4/versions",
      );
    });

    expect(await screen.findByText("Release Notes")).toBeInTheDocument();
    expect(await screen.findByText("Added sample entry.")).toBeInTheDocument();

    fetchSpy.mockRestore();
  });

  it("renders version changelog view for custom update URLs", async () => {
    mockLoadRegistryDetail.mockResolvedValue(CUSTOM_MAP_LOADED);

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          versions: [
            {
              version: "1.0.0",
              changelog: "## Custom Changelog\n\n- Loaded from the update JSON.",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    render(
      <RegistryDetailPage routeSegment="maps" id="gwangju-4" tabId="versions" versionId="1.0.0" />,
    );

    expect(await screen.findByText("Release Notes")).toBeInTheDocument();
    expect(await screen.findByText("Loaded from the update JSON.")).toBeInTheDocument();

    expect(fetchSpy).toHaveBeenCalledWith("https://updates.example/gwangju.json");

    fetchSpy.mockRestore();
  });

  it("renders details tab metric cards", async () => {
    mockLoadRegistryDetail.mockResolvedValue(MAP_LOADED);

    render(<RegistryDetailPage routeSegment="maps" id="gwangju-4" tabId="details" />);

    await waitFor(() => {
      expect(screen.getAllByRole("heading", { name: "Gwangju" }).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText("Date Published").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Date Updated").length).toBeGreaterThan(0);
    expect(screen.getByText(/latest version/i)).toBeInTheDocument();
    expect(screen.getByText(/version count/i)).toBeInTheDocument();
    expect(screen.getAllByText("1.0.0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("File Sizes").length).toBeGreaterThan(0);
    expect(screen.getByText("Map Stats")).toBeInTheDocument();
    expect(screen.getAllByText("Data Quality").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Level of Detail").length).toBeGreaterThan(0);
    expect(screen.queryByText("Population Rank")).not.toBeInTheDocument();
    expect(screen.getAllByText("Playable Area").length).toBeGreaterThan(0);
    expect(screen.getByText("2,150,000")).toBeInTheDocument();
    expect(screen.getByText("8,934")).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === "5,617 km2"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Version Count/i })).toHaveAttribute(
      "href",
      "/registry/maps/gwangju-4/versions",
    );
    expect(screen.getByRole("link", { name: /Latest Version/i })).toHaveAttribute(
      "href",
      "/registry/maps/gwangju-4/versions/1.0.0",
    );
  });

  it("renders map tab empty state when grid data is unavailable", async () => {
    mockLoadRegistryDetail.mockResolvedValue(MAP_LOADED);
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 404 }));

    render(<RegistryDetailPage routeSegment="maps" id="gwangju-4" tabId="map" />);

    await waitFor(() => {
      expect(screen.getAllByRole("heading", { name: "Gwangju" }).length).toBeGreaterThan(0);
    });

    expect(await screen.findByText("Heatmap grid data is not available.")).toBeInTheDocument();
    fetchSpy.mockRestore();
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
      versionReleaseDates: {},
      versionDownloads: {},
      authorAttributionHref: null,
    });

    render(<RegistryDetailPage routeSegment="mods" id="example-mod" />);

    await waitFor(() => {
      expect(screen.getAllByRole("heading", { name: "Example Mod" }).length).toBeGreaterThan(0);
    });
  });
});
