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
  AnalyticsPieChart: ({
    data,
  }: {
    data: Array<{ name: string; value: number }>;
  }) => (
    <div data-testid="registry-pie-chart">
      {data.map((slice) => `${slice.name}: ${slice.value}`).join(", ")}
    </div>
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
                downloads: 84,
              },
            ],
          },
          "3d": { maps: [], mods: [] },
          "7d": { maps: [], mods: [] },
          "14d": { maps: [], mods: [] },
        },
        history: [
          {
            date: "2026-03-11",
            downloads: { total: 100, maps: 80, mods: 20 },
            listings: { total: 8, maps: 6, mods: 2 },
          },
          {
            date: "2026-03-12",
            downloads: { total: 200, maps: 160, mods: 40 },
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
    expect(screen.getByTestId("registry-download-chart")).toHaveTextContent(
      "1 points · Maps, Mods, Total",
    );
    const pieCharts = screen.getAllByTestId("registry-pie-chart");
    expect(pieCharts[0]).toHaveTextContent("Maps: 8");
    expect(pieCharts[1]).toHaveTextContent("Maps: 240");
  });

  it("renders content analytics for the selected asset type", async () => {
    render(<RegistryAnalyticsPage tabId="content" assetTypeId="mods" />);

    await waitFor(() => {
      expect(screen.getByText("Mod Alpha")).toBeInTheDocument();
    });

    expect(screen.getByTestId("registry-download-chart")).toHaveTextContent(
      "1 points · Downloads",
    );
    expect(screen.getByText("Rankings")).toBeInTheDocument();
    expect(screen.getByText("Author B")).toBeInTheDocument();
    expect(screen.getByText("84")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Downloads/i })).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText("Search mods...");
    fireEvent.change(searchInput, {
      target: { value: "missing asset" },
    });

    expect(screen.getByText("No items match your search.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear Filters" })).toBeInTheDocument();
  });
});
