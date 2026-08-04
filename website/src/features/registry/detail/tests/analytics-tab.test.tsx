import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AnalyticsTab } from "@/features/registry/detail/components/analytics-tab";
import type {
  RegistryDetailModel,
  RegistryDetailVersionDailySeries,
} from "@/features/registry/detail/registry-detail-types";

vi.mock("@subway-builder-modded/analytics", () => ({
  AnalyticsLineChart: ({
    data,
    lines,
  }: {
    data: Array<Record<string, unknown>>;
    lines: Array<{ name: string }>;
  }) => (
    <div data-testid="detail-line-chart">
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
    <div data-testid="detail-stacked-chart">
      {data.length} points · {bars.map((bar) => bar.name).join(", ")}
    </div>
  ),
  AnalyticsPieChart: ({ data }: { data: Array<{ name: string; value: number }> }) => (
    <div data-testid="detail-pie-chart">
      {data.map((slice) => `${slice.name}: ${slice.value}`).join(", ")}
    </div>
  ),
}));

function makeDetail(
  versionDownloadHistory: RegistryDetailVersionDailySeries[],
): RegistryDetailModel {
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
    downloadHistory: [
      { date: "2026-01-02", downloads: 5 },
      { date: "2026-01-03", downloads: 7 },
    ],
    versionDownloadHistory,
    downloadTrends: [],
    galleryImages: [],
    versions: [],
    versionSource: null,
    latestVersion: null,
    latestDownloadUrl: null,
    publishedDate: null,
    updatedDate: null,
    integrityVersionCount: 0,
    mapFields: null,
    deprecation: null,
  };
}

describe("AnalyticsTab download history", () => {
  it("stacks per-version series with a share pie when version data exists", () => {
    render(
      <AnalyticsTab
        detail={makeDetail([
          {
            version: "1.0.0",
            totalDownloads: 9,
            history: [
              { date: "2026-01-02", downloads: 5 },
              { date: "2026-01-03", downloads: 4 },
            ],
          },
          {
            version: "1.1.0",
            totalDownloads: 3,
            history: [
              { date: "2026-01-02", downloads: 0 },
              { date: "2026-01-03", downloads: 3 },
            ],
          },
        ])}
      />,
    );

    expect(screen.getByText("Daily Downloads by Version")).toBeInTheDocument();
    expect(screen.getByTestId("detail-line-chart")).toHaveTextContent("2 points · 1.0.0, 1.1.0");
    expect(screen.getByText("Download Share by Version")).toBeInTheDocument();
    // Pie shares come from the drawn window's daily sums, matching the chart.
    expect(screen.getByTestId("detail-pie-chart")).toHaveTextContent("1.0.0: 9, 1.1.0: 3");
  });

  it("windows the chart and pie to the selected period", () => {
    const detail = makeDetail([
      {
        version: "1.0.0",
        totalDownloads: 15,
        history: [
          { date: "2026-01-01", downloads: 1 },
          { date: "2026-01-02", downloads: 2 },
          { date: "2026-01-03", downloads: 3 },
          { date: "2026-01-04", downloads: 4 },
          { date: "2026-01-05", downloads: 5 },
        ],
      },
      {
        version: "1.1.0",
        totalDownloads: 3,
        history: [
          { date: "2026-01-03", downloads: 1 },
          { date: "2026-01-04", downloads: 1 },
          { date: "2026-01-05", downloads: 1 },
        ],
      },
    ]);
    detail.downloadHistory = [
      { date: "2026-01-01", downloads: 1 },
      { date: "2026-01-02", downloads: 2 },
      { date: "2026-01-03", downloads: 4 },
      { date: "2026-01-04", downloads: 5 },
      { date: "2026-01-05", downloads: 6 },
    ];

    render(<AnalyticsTab detail={detail} />);

    expect(screen.getByTestId("detail-line-chart")).toHaveTextContent("5 points · 1.0.0, 1.1.0");

    const periodTab = screen.getByRole("tab", { name: "Last 3 Days" });
    fireEvent.mouseDown(periodTab, { button: 0 });
    fireEvent.click(periodTab);

    expect(screen.getByTestId("detail-line-chart")).toHaveTextContent("3 points · 1.0.0, 1.1.0");
    // The pie decomposes the same 3-day window, not the all-time totals.
    expect(screen.getByTestId("detail-pie-chart")).toHaveTextContent("1.0.0: 12, 1.1.0: 3");
  });

  it("falls back to a single listing series without a pie when no version data exists", () => {
    render(<AnalyticsTab detail={makeDetail([])} />);

    expect(screen.getByText("Daily Downloads")).toBeInTheDocument();
    expect(screen.getByTestId("detail-line-chart")).toHaveTextContent("2 points · Downloads");
    expect(screen.queryByText("Download Share by Version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("detail-pie-chart")).not.toBeInTheDocument();
  });
});
