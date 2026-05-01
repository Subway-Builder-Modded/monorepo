// @vitest-environment jsdom

import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnalyticsLineChart } from "../src/charts/analytics-line-chart";
import { AnalyticsBarChart } from "../src/charts/analytics-bar-chart";
import { AnalyticsTooltip } from "../src/charts/chart-tooltip";

vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  const React = await import("react");
  return {
    ...actual,
    ResponsiveContainer: ({
      children,
    }: {
      children: React.ReactNode;
    }) =>
      React.createElement(
        "div",
        { "data-testid": "responsive-container", style: { width: 500, height: 300 } },
        children,
      ),
  };
});

afterEach(cleanup);

const SAMPLE_DATA = [
  { date: "2026-04-20", users: 560, public: 4, private: 10 },
  { date: "2026-04-21", users: 562, public: 6, private: 9 },
  { date: "2026-04-22", users: 563, public: 5, private: 7 },
];

describe("AnalyticsLineChart", () => {
  it("renders without crashing with valid data", () => {
    const { container } = render(
      <AnalyticsLineChart
        data={SAMPLE_DATA}
        lines={[{ key: "users", name: "Members" }]}
        xAxisKey="date"
      />,
    );
    expect(container.firstChild).not.toBeNull();
  });

  it("renders a responsive container for the chart", () => {
    render(
      <AnalyticsLineChart
        data={SAMPLE_DATA}
        lines={[{ key: "users", name: "Members" }]}
        xAxisKey="date"
      />,
    );
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("renders multiple lines without crashing", () => {
    const { container } = render(
      <AnalyticsLineChart
        data={SAMPLE_DATA}
        lines={[
          { key: "users", name: "Members", color: "var(--accent)" },
          { key: "public", name: "Public messages", color: "#8b5cf6" },
        ]}
        xAxisKey="date"
      />,
    );
    expect(container.firstChild).not.toBeNull();
  });
});

describe("AnalyticsBarChart", () => {
  it("renders without crashing with valid data", () => {
    const { container } = render(
      <AnalyticsBarChart
        data={SAMPLE_DATA}
        bars={[
          { key: "public", name: "Public" },
          { key: "private", name: "Private" },
        ]}
        xAxisKey="date"
        stacked
      />,
    );
    expect(container.firstChild).not.toBeNull();
  });

  it("renders a responsive container for the chart", () => {
    render(
      <AnalyticsBarChart
        data={SAMPLE_DATA}
        bars={[{ key: "public", name: "Public" }]}
        xAxisKey="date"
      />,
    );
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("renders grouped bars without crashing", () => {
    const { container } = render(
      <AnalyticsBarChart
        data={SAMPLE_DATA}
        bars={[
          { key: "public", name: "Public", color: "var(--accent)" },
          { key: "private", name: "Private", color: "#8b5cf6" },
        ]}
        xAxisKey="date"
        stacked={false}
      />,
    );
    expect(container.firstChild).not.toBeNull();
  });
});

describe("AnalyticsTooltip", () => {
  it("renders nothing when not active", () => {
    const { container } = render(
      <AnalyticsTooltip active={false} payload={[]} label="Apr 20" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when payload is empty", () => {
    const { container } = render(
      <AnalyticsTooltip active={true} payload={[]} label="Apr 20" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders label and payload entries when active", () => {
    render(
      <AnalyticsTooltip
        active={true}
        payload={[{ name: "Members", value: 560, color: "#6366f1" }]}
        label="Apr 20"
      />,
    );
    expect(screen.getByText("Apr 20")).toBeInTheDocument();
    expect(screen.getByText("Members")).toBeInTheDocument();
    expect(screen.getByText("560")).toBeInTheDocument();
  });

  it("renders multiple payload entries", () => {
    render(
      <AnalyticsTooltip
        active={true}
        payload={[
          { name: "Public", value: 4, color: "#6366f1" },
          { name: "Private", value: 10, color: "#8b5cf6" },
        ]}
        label="Apr 20"
      />,
    );
    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.getByText("Private")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });
});
