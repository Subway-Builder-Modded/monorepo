import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { RegistryAnalyticsPage } from "./registry-analytics-page";

vi.mock("@/lib/router", () => ({
  navigate: vi.fn(),
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@subway-builder-modded/analytics", () => ({
  AnalyticsLineChart: ({
    data,
    lines,
  }: {
    data: Array<Record<string, unknown>>;
    lines: Array<{ name: string }>;
  }) => (
    <div data-testid="registry-download-chart">
      {data.length} points · {lines.map((line) => line.name).join(", ")}
    </div>
  ),
  AnalyticsStackedBarChart: ({
    data,
    bars,
  }: {
    data: Array<Record<string, unknown>>;
    bars: Array<{ name: string }>;
  }) => (
    <div data-testid="registry-stacked-chart">
      {data.length} points · {bars.map((bar) => bar.name).join(", ")}
    </div>
  ),
  AnalyticsPieChart: ({ data }: { data: Array<{ name: string; value: number }> }) => (
    <div data-testid="registry-pie-chart">
      {data.map((slice) => `${slice.name}: ${slice.value}`).join(", ")}
    </div>
  ),
}));

vi.mock("@/features/registry/components/author-role-badge", () => ({
  AuthorRoleBadge: ({ authorId }: { authorId: string | null | undefined }) => (
    <span data-testid={`author-role-badge-${authorId ?? "unknown"}`}>Developer role</span>
  ),
}));

vi.mock("./lib/load-registry-analytics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/load-registry-analytics")>();
  return {
    ...actual,
    loadRegistryAnalyticsData: () =>
      Promise.resolve({
        overview: {
          downloads: 300,
          listings: 12,
          authors: 4,
          maps: { listings: 8, downloads: 240 },
          mods: { listings: 4, downloads: 60 },
        },
        contentRankings: {
          "all-time": {
            maps: [
              {
                id: "map-a",
                type: "maps",
                name: "Map Alpha",
                authorId: "author-a",
                authorName: "Author A",
                searchAliases: ["Tokyo", "Toukyou"],
                downloads: 42,
              },
            ],
            mods: [
              {
                id: "mod-a",
                type: "mods",
                name: "Mod Alpha",
                authorId: "author-b",
                authorName: "Author B",
                searchAliases: ["Alternate Mod"],
                downloads: 84,
              },
            ],
          },
          "3d": { maps: [], mods: [] },
          "7d": { maps: [], mods: [] },
          "14d": { maps: [], mods: [] },
        },
        authors: {
          history: [
            { date: "2026-03-11", authors: 1 },
            { date: "2026-03-12", authors: 2 },
          ],
          rankings: [
            {
              id: "author-a",
              name: "Author A",
              href: "/registry/authors/author-a",
              downloads: 120,
              maps: 3,
              mods: 1,
              assets: 4,
            },
            {
              id: "author-b",
              name: "Author B",
              href: "/registry/authors/author-b",
              downloads: 84,
              maps: 0,
              mods: 2,
              assets: 2,
            },
          ],
        },
        projects: {
          rankings: [
            {
              id: "author-a/project-a",
              name: "Project A",
              href: "/registry/authors/author-a/project-a",
              authorId: "author-a",
              authorName: "Author A",
              authorHref: "/registry/authors/author-a",
              downloads: 220,
              maps: 2,
              mods: 0,
              assets: 2,
            },
            {
              id: "author-b/project-b",
              name: "Project B",
              href: "/registry/authors/author-b/project-b",
              authorId: "author-b",
              authorName: "Author B",
              authorHref: "/registry/authors/author-b",
              downloads: 84,
              maps: 1,
              mods: 0,
              assets: 1,
            },
          ],
        },
        mapStatistics: {
          rankings: [
            {
              id: "map-a",
              name: "Map Alpha",
              authorId: "author-a",
              authorName: "Author A",
              countryCode: "JP",
              cityCode: "TYO",
              searchAliases: ["Tokyo", "Toukyou"],
              demand: 1_000_000,
              pops: 2_000,
              demandPoints: 300,
              playableAreaKm2: 42,
            },
          ],
        },
        history: [
          {
            date: "2026-03-11",
            downloads: { total: 100, maps: 80, mods: 20 },
            cumulativeDownloads: { total: 100, maps: 80, mods: 20 },
            listings: { total: 8, maps: 6, mods: 2 },
          },
          {
            date: "2026-03-12",
            downloads: { total: 200, maps: 160, mods: 40 },
            cumulativeDownloads: { total: 300, maps: 240, mods: 60 },
            listings: { total: 4, maps: 2, mods: 2 },
          },
        ],
      }),
  };
});

describe("RegistryAnalyticsPage", () => {
  it("renders the registry analytics overview shell", async () => {
    render(<RegistryAnalyticsPage />);

    expect(screen.getByRole("heading", { name: "Analytics" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Registry" })).toHaveAttribute(
      "href",
      "/registry",
    );
    expect(screen.getByRole("link", { name: "View Documentation" })).toHaveAttribute(
      "href",
      "/registry/docs",
    );

    await waitFor(() => {
      expect(screen.getByText("300")).toBeInTheDocument();
    });

    expect(screen.getByRole("tab", { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Content/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Projects/i })).toBeInTheDocument();
    expect(screen.getByTestId("registry-download-chart")).toHaveTextContent(
      "1 points · Maps, Mods, Total",
    );
    expect(screen.getByTestId("registry-stacked-chart")).toHaveTextContent("2 points · Maps, Mods");
    const pieCharts = screen.getAllByTestId("registry-pie-chart");
    expect(pieCharts[0]).toHaveTextContent("Maps: 8");
    expect(pieCharts[1]).toHaveTextContent("Maps: 240");
  });

  it("renders content analytics for the selected asset type", async () => {
    render(<RegistryAnalyticsPage tabId="content" assetTypeId="mods" />);

    await waitFor(() => {
      expect(screen.getByText("Mod Alpha")).toBeInTheDocument();
    });

    expect(screen.getByTestId("registry-download-chart")).toHaveTextContent("1 points · Downloads");
    expect(screen.getByText("Rankings")).toBeInTheDocument();
    expect(screen.getByText("Author B")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mod Alpha/i })).toHaveAttribute(
      "href",
      "/registry/mods/mod-a/analytics",
    );
    expect(screen.getByRole("link", { name: /Author B/i })).toHaveAttribute(
      "href",
      "/registry/authors/author-b/analytics",
    );
    expect(screen.getByText("84")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Downloads/i })).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText("Search mods...");
    fireEvent.change(searchInput, {
      target: { value: "alternate mod" },
    });

    expect(screen.getByText("Mod Alpha")).toBeInTheDocument();

    fireEvent.change(searchInput, {
      target: { value: "missing asset" },
    });

    expect(screen.getByText("No items match your search.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear Filters" })).toBeInTheDocument();
  });

  it("renders author analytics timeline and rankings", async () => {
    render(<RegistryAnalyticsPage tabId="authors" />);

    await waitFor(() => {
      expect(screen.getByText("Author A")).toBeInTheDocument();
    });

    expect(screen.getByText("Timeline")).toBeInTheDocument();
    expect(screen.getByTestId("registry-download-chart")).toHaveTextContent("2 points · Authors");
    expect(screen.getByText("Maps Published")).toBeInTheDocument();
    expect(screen.getByText("Mods Published")).toBeInTheDocument();
    expect(screen.getByText("Assets Published")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search authors...")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Author A/i })).toHaveAttribute(
      "href",
      "/registry/authors/author-a/analytics",
    );
    expect(screen.getByTestId("author-role-badge-author-a")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Author A/i })).not.toHaveTextContent("Developer role");
  });

  it("renders project analytics rankings and omits all-zero columns", async () => {
    render(<RegistryAnalyticsPage tabId="projects" />);

    await waitFor(() => {
      expect(screen.getByText("Project A")).toBeInTheDocument();
    });

    expect(screen.getByText("Rankings")).toBeInTheDocument();
    expect(screen.getByText("Author")).toBeInTheDocument();
    expect(screen.getByText("Maps")).toBeInTheDocument();
    expect(screen.queryByText("Mods")).not.toBeInTheDocument();
    expect(screen.getByText("Assets")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search projects...")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Project A/i })).toHaveAttribute(
      "href",
      "/registry/authors/author-a/project-a/analytics",
    );
    expect(screen.getByRole("link", { name: /Author A/i })).toHaveAttribute(
      "href",
      "/registry/authors/author-a/analytics",
    );
    expect(screen.getByTestId("author-role-badge-author-a")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Author A/i })).not.toHaveTextContent("Developer role");
  });

  it("renders map statistics rankings", async () => {
    render(<RegistryAnalyticsPage tabId="map-statistics" />);

    await waitFor(() => {
      expect(screen.getByText("Map Alpha")).toBeInTheDocument();
    });

    expect(screen.getByText("Country")).toBeInTheDocument();
    expect(screen.getByText("City Code")).toBeInTheDocument();
    expect(screen.getByText("Demand")).toBeInTheDocument();
    expect(screen.getByText("Pops")).toBeInTheDocument();
    expect(screen.getByText("Demand Points")).toBeInTheDocument();
    expect(screen.getByText("Playable Area")).toBeInTheDocument();
    expect(screen.getByText("42 km²")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Map Alpha/i })).toHaveAttribute(
      "href",
      "/registry/maps/map-a/analytics",
    );
    expect(screen.getByRole("link", { name: /Author A/i })).toHaveAttribute(
      "href",
      "/registry/authors/author-a/analytics",
    );

    const searchInput = screen.getByPlaceholderText("Search maps...");
    fireEvent.change(searchInput, {
      target: { value: "toukyou" },
    });

    expect(screen.getByText("Map Alpha")).toBeInTheDocument();
  });
});
