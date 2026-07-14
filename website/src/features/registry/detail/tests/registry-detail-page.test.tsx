import { render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegistryDetailPage } from "@/features/registry/detail/registry-detail-page";
import { loadRegistryDetail } from "@/features/registry/detail/lib/load-registry-detail";
import { normalizeRegistryDetail } from "@/features/registry/detail/lib/normalize-registry-detail";
import { preloadDetailTabAssets } from "@/features/registry/detail/lib/preload-detail-tab-assets";
import type { RegistryDetailModel } from "@/features/registry/detail/registry-detail-types";

vi.mock("@/lib/router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  navigate: vi.fn(),
}));

vi.mock("@/lib/country-flags", () => ({
  getCountryFlagIcon: () => null,
}));

vi.mock("@/features/not-found", () => ({
  NotFoundPage: () => <div data-testid="not-found">Not found</div>,
}));

vi.mock("@/features/registry/detail/hooks/use-floating-anchor-visibility", () => ({
  useFloatingAnchorVisibility: () => false,
}));

vi.mock("@/features/registry/detail/lib/load-registry-detail", () => ({
  loadRegistryDetail: vi.fn(),
}));

vi.mock("@/features/registry/detail/lib/normalize-registry-detail", () => ({
  normalizeRegistryDetail: vi.fn(),
}));

vi.mock("@/features/registry/detail/lib/preload-detail-tab-assets", () => ({
  preloadDetailTabAssets: vi.fn(),
}));

vi.mock("@/features/registry/detail/components/details-tab", () => ({
  DetailsTab: () => <div>Details</div>,
}));
vi.mock("@/features/registry/detail/components/analytics-tab", () => ({
  AnalyticsTab: () => <div>Analytics</div>,
}));
vi.mock("@/features/registry/detail/components/description-tab", () => ({
  DescriptionTab: ({ description }: { description: string }) => <div>{description}</div>,
}));
vi.mock("@/features/registry/detail/components/gallery-lightbox", () => ({
  GalleryLightbox: () => null,
}));
vi.mock("@/features/registry/detail/components/gallery-tab", () => ({
  GalleryTab: () => <div>Gallery</div>,
}));
vi.mock("@/features/registry/detail/components/map-tab", () => ({
  MapTab: () => <div>Map</div>,
}));
vi.mock("@/features/registry/detail/components/open-in-railyard-dialog", () => ({
  OpenInRailyardDialog: () => null,
}));
vi.mock("@/features/registry/detail/components/registry-detail-header", () => ({
  RegistryDetailHeader: ({ detail }: { detail: RegistryDetailModel }) => <h1>{detail.name}</h1>,
}));
vi.mock("@/features/registry/detail/components/registry-detail-sidebar", () => ({
  RegistryDetailSidebar: () => <aside>Sidebar</aside>,
}));
vi.mock("@/features/registry/detail/components/registry-detail-tabs", () => ({
  RegistryDetailTabs: () => <nav>Tabs</nav>,
}));
vi.mock("@/features/registry/detail/components/versions-tab", () => ({
  VersionsTab: () => <div>Versions</div>,
}));

function makeDetail(): RegistryDetailModel {
  return {
    id: "asset-a",
    typeId: "maps",
    routeSegment: "maps",
    typeConfig: {
      id: "maps",
      label: "Map",
      pluralLabel: "Maps",
      routeSegment: "maps",
      accentLight: "#2563eb",
      accentDark: "#60a5fa",
    },
    name: "Asset A",
    description: "Loaded detail metadata",
    excerpt: null,
    authorLabel: "Author",
    authorId: null,
    authorHref: null,
    collaborators: [],
    sourceCodeLink: null,
    projectId: null,
    tags: [],
    downloads: null,
    downloadAnalytics: { rank: null, allTime: null, last14Days: null, last7Days: null },
    downloadHistory: [],
    downloadTrends: [],
    galleryImages: ["https://cdn.example.test/first.webp", "https://cdn.example.test/second.webp"],
    versions: [],
    versionSource: null,
    latestVersion: null,
    latestDownloadUrl: null,
    publishedDate: null,
    updatedDate: null,
    integrityVersionCount: 0,
    mapFields: null,
  };
}

beforeEach(() => {
  vi.mocked(loadRegistryDetail).mockReset();
  vi.mocked(normalizeRegistryDetail).mockReset();
  vi.mocked(preloadDetailTabAssets).mockReset();
});

describe("RegistryDetailPage", () => {
  it("renders detail metadata without waiting for image preloading", async () => {
    vi.mocked(loadRegistryDetail).mockResolvedValue({} as never);
    vi.mocked(normalizeRegistryDetail).mockReturnValue(makeDetail());
    vi.mocked(preloadDetailTabAssets).mockReturnValue(new Promise(() => {}));

    render(<RegistryDetailPage routeSegment="maps" id="asset-a" />);

    expect(await screen.findByRole("heading", { name: "Asset A" })).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("keeps rendered detail visible when best-effort preloading fails", async () => {
    vi.mocked(loadRegistryDetail).mockResolvedValue({} as never);
    vi.mocked(normalizeRegistryDetail).mockReturnValue(makeDetail());
    vi.mocked(preloadDetailTabAssets).mockRejectedValue(new Error("preload failed"));

    render(<RegistryDetailPage routeSegment="maps" id="asset-a" />);

    expect(await screen.findByRole("heading", { name: "Asset A" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId("not-found")).not.toBeInTheDocument());
  });

  it("uses the remote map-data basemap URL for the background", async () => {
    vi.mocked(loadRegistryDetail).mockResolvedValue({} as never);
    vi.mocked(normalizeRegistryDetail).mockReturnValue(makeDetail());
    vi.mocked(preloadDetailTabAssets).mockResolvedValue();

    render(<RegistryDetailPage routeSegment="maps" id="asset-a" />);

    const background = await screen.findByTestId("map-basemap-background");
    expect(background).toHaveAttribute(
      "src",
      "https://raw.githubusercontent.com/Subway-Builder-Modded/registry/map-data/maps/asset-a/basemap.svg",
    );
  });
});
