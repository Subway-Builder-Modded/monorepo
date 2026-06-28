import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  RegistryAuthorPage,
  RegistryProjectPage,
} from "@/features/registry/authors/registry-author-page";

const mockLoadAuthorPageData = vi.fn();
const mockLoadProjectPageData = vi.fn();

vi.mock("@/features/registry/authors/lib/load-author-page-data", () => ({
  loadAuthorPageData: (...args: unknown[]) => mockLoadAuthorPageData(...args),
}));

vi.mock("@/features/registry/authors/lib/load-project-page-data", () => ({
  loadProjectPageData: (...args: unknown[]) => mockLoadProjectPageData(...args),
}));

vi.mock("@subway-builder-modded/analytics", () => ({
  AnalyticsLineChart: ({ data }: { data: Array<Record<string, unknown>> }) => (
    <div data-testid="author-download-history-chart">{data.length} history points</div>
  ),
}));

vi.mock("@/lib/router", () => ({
  Link: ({
    to,
    children,
    preserveScroll: _preserveScroll,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    preserveScroll?: boolean;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  navigate: vi.fn(),
  useLocation: () => ({ pathname: "/registry/authors/ahkimn", search: "" }),
}));

const SAMPLE_ITEM_BASE = {
  author: "Yukina-",
  authorId: "ahkimn",
  description: "A registry asset.",
  tags: ["east-asia"],
  thumbnailSrc: null,
  cityCode: null,
  countryCode: null,
  countryName: null,
  countryEmoji: null,
  population: null,
  isTest: false,
  manifest: {},
};

describe("RegistryAuthorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    class ResizeObserverMock {
      observe() {}
      disconnect() {}
    }
    Object.assign(globalThis, { ResizeObserver: ResizeObserverMock });
  });

  it("renders the author overview and grouped published assets", async () => {
    mockLoadAuthorPageData.mockResolvedValue({
      author: {
        githubId: 19807509,
        authorId: "ahkimn",
        authorAlias: "Yukina-",
        attributionMethod: "custom",
        attributionLink: "https://subwaybuildermodded.com/credits",
        contributorTier: "developer",
      },
      itemsByType: {
        maps: [
          {
            ...SAMPLE_ITEM_BASE,
            id: "yukina-osaka",
            type: "maps",
            routeSegment: "maps",
            href: "/registry/maps/yukina-osaka",
            projectId: "ahkimn/subwaybuilder-jp-maps",
            name: "Osaka",
            totalDownloads: 120,
            lastActivityAt: Date.parse("2026-06-20T00:00:00Z"),
            publishedAt: Date.parse("2026-05-01T00:00:00Z"),
            latestVersion: "v0.2.0",
            latestVersionUpdatedAt: Date.parse("2026-06-20T00:00:00Z"),
            cityCode: "ITM",
            countryCode: "JP",
            countryName: "Japan",
            population: 6_524_079,
          },
        ],
        mods: [
          {
            ...SAMPLE_ITEM_BASE,
            id: "signal-pack",
            type: "mods",
            routeSegment: "mods",
            href: "/registry/mods/signal-pack",
            name: "Signal Pack",
            totalDownloads: 30,
            lastActivityAt: Date.parse("2026-04-10T00:00:00Z"),
            publishedAt: Date.parse("2026-04-01T00:00:00Z"),
            latestVersion: "1.0.0",
            latestVersionUpdatedAt: Date.parse("2026-04-10T00:00:00Z"),
          },
        ],
      },
      collaborations: [],
      projects: [
        {
          projectId: "ahkimn/subwaybuilder-jp-maps",
          projectName: "subwaybuilder-jp-maps",
          href: "/registry/authors/ahkimn/subwaybuilder-jp-maps",
          maps: 1,
          mods: 0,
          totalDownloads: 120,
          rank: 3,
        },
      ],
      contributorsByItemKey: {},
      overview: {
        newestAsset: {
          id: "yukina-osaka",
          name: "Osaka",
          href: "/registry/maps/yukina-osaka",
          publishedAt: Date.parse("2026-05-01T00:00:00Z"),
          latestVersion: "v0.2.0",
          latestVersionUpdatedAt: Date.parse("2026-06-20T00:00:00Z"),
        },
        mostRecentUpdate: {
          id: "yukina-osaka",
          name: "Osaka",
          href: "/registry/maps/yukina-osaka",
          publishedAt: Date.parse("2026-05-01T00:00:00Z"),
          latestVersion: "v0.2.0",
          latestVersionUpdatedAt: Date.parse("2026-06-20T00:00:00Z"),
        },
      },
      analytics: {
        downloads: {
          total: 150,
          maps: 120,
          mods: 30,
        },
        ranks: {
          total: 1,
          maps: 1,
          mods: 2,
        },
        history: [
          { date: "2026-06-19", total: 5, maps: 3, mods: 2 },
          { date: "2026-06-20", total: 8, maps: 7, mods: 1 },
        ],
        trends: [
          { period: "1d", label: "Last 24 Hours", downloads: 8, rank: 1 },
          { period: "3d", label: "Last 3 Days", downloads: 13, rank: 1 },
          { period: "7d", label: "Last 7 Days", downloads: 13, rank: 2 },
          { period: "14d", label: "Last 14 Days", downloads: 13, rank: 2 },
        ],
        rankingsByType: {
          maps: [
            {
              id: "yukina-osaka",
              name: "Osaka",
              href: "/registry/maps/yukina-osaka",
              downloads: 120,
              rank: 1,
            },
          ],
          mods: [
            {
              id: "signal-pack",
              name: "Signal Pack",
              href: "/registry/mods/signal-pack",
              downloads: 30,
              rank: 2,
            },
          ],
        },
      },
    });

    const { rerender } = render(<RegistryAuthorPage authorId="ahkimn" />);

    expect(await screen.findByRole("heading", { name: "Yukina-" })).toBeInTheDocument();
    expect(screen.getByText("Author")).toBeInTheDocument();
    expect(screen.queryByText("ahkimn")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Open Yukina- attribution link")).toHaveAttribute(
      "href",
      "https://subwaybuildermodded.com/credits",
    );

    expect(screen.getByText("Assets Published")).toBeInTheDocument();
    expect(screen.getAllByText("Downloads").length).toBeGreaterThan(0);
    expect(screen.getAllByText("150").length).toBeGreaterThan(0);
    expect(
      screen
        .getAllByRole("link", { name: "Osaka" })
        .some((link) => link.getAttribute("href") === "/registry/maps/yukina-osaka"),
    ).toBe(true);

    const mapsSection = screen.getByRole("heading", { name: "Published Maps" }).closest("section");
    expect(mapsSection).not.toBeNull();
    expect(within(mapsSection!).getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getByRole("radio", { name: "Mods" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Mods" })).not.toBeInTheDocument();

    rerender(<RegistryAuthorPage authorId="ahkimn" tabId="projects" />);
    expect(await screen.findByText("Published Projects")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "subwaybuilder-jp-maps" })).toHaveAttribute(
      "href",
      "/registry/authors/ahkimn/subwaybuilder-jp-maps",
    );
    expect(screen.getAllByText("Maps").length).toBeGreaterThan(0);

    rerender(<RegistryAuthorPage authorId="ahkimn" tabId="analytics" />);
    expect(await screen.findByText("Downloads (Total)")).toBeInTheDocument();
    expect(screen.getByText("Recent Trends")).toBeInTheDocument();
    expect(screen.getByText("Download History")).toBeInTheDocument();
    expect(screen.getByText("Asset Rankings")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  }, 20_000);

  it("renders the project overview with project-specific copy and links", async () => {
    mockLoadProjectPageData.mockResolvedValue({
      project: {
        projectId: "ahkimn/subwaybuilder-jp-maps",
        projectName: "subwaybuilder-jp-maps",
        authorId: "ahkimn",
        authorLabel: "Yukina-",
        githubUrl: "https://github.com/ahkimn/subwaybuilder-jp-maps",
      },
      itemsByType: {
        maps: [
          {
            ...SAMPLE_ITEM_BASE,
            id: "yukina-osaka",
            type: "maps",
            routeSegment: "maps",
            href: "/registry/maps/yukina-osaka",
            projectId: "ahkimn/subwaybuilder-jp-maps",
            name: "Osaka",
            totalDownloads: 120,
            lastActivityAt: Date.parse("2026-06-20T00:00:00Z"),
            publishedAt: Date.parse("2026-05-01T00:00:00Z"),
            latestVersion: "v0.2.0",
            latestVersionUpdatedAt: Date.parse("2026-06-20T00:00:00Z"),
          },
        ],
        mods: [],
      },
      collaborations: [],
      projects: [],
      contributorsByItemKey: {},
      overview: {
        newestAsset: {
          id: "yukina-osaka",
          name: "Osaka",
          href: "/registry/maps/yukina-osaka",
          publishedAt: Date.parse("2026-05-01T00:00:00Z"),
          latestVersion: "v0.2.0",
          latestVersionUpdatedAt: Date.parse("2026-06-20T00:00:00Z"),
        },
        mostRecentUpdate: {
          id: "yukina-osaka",
          name: "Osaka",
          href: "/registry/maps/yukina-osaka",
          publishedAt: Date.parse("2026-05-01T00:00:00Z"),
          latestVersion: "v0.2.0",
          latestVersionUpdatedAt: Date.parse("2026-06-20T00:00:00Z"),
        },
      },
      analytics: {
        downloads: {
          total: 120,
          maps: 120,
          mods: 0,
        },
        ranks: {
          total: 3,
          maps: 2,
          mods: null,
        },
        history: [{ date: "2026-06-20", total: 7, maps: 7, mods: 0 }],
        trends: [{ period: "1d", label: "Last 24 Hours", downloads: 7, rank: 2 }],
        rankingsByType: {
          maps: [
            {
              id: "yukina-osaka",
              name: "Osaka",
              href: "/registry/maps/yukina-osaka",
              downloads: 120,
              rank: 1,
            },
          ],
          mods: [],
        },
      },
    });

    render(<RegistryProjectPage authorId="ahkimn" projectName="subwaybuilder-jp-maps" />);

    expect(
      await screen.findByRole("heading", { name: "subwaybuilder-jp-maps" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Project")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Yukina-" })).toHaveAttribute(
      "href",
      "/registry/authors/ahkimn",
    );
    expect(screen.getByLabelText("Open subwaybuilder-jp-maps on GitHub")).toHaveAttribute(
      "href",
      "https://github.com/ahkimn/subwaybuilder-jp-maps",
    );
    expect(screen.getAllByText("Assets").length).toBeGreaterThan(0);
    expect(screen.queryByText("Assets Published")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Maps" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Published Maps" })).not.toBeInTheDocument();
  });
});
