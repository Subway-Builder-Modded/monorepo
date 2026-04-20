// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { SectionHeader } from "./section-header";
import { SectionShell } from "./section-shell";
import { TwoColumnSection } from "./two-column-section";

describe("Section primitives", () => {
  it("renders section header title, description, and kicker", () => {
    render(
      <SectionHeader
        kicker="Overview"
        title="In-depth analytics and insights"
        description="Download counts and trend information"
      />,
    );

    expect(screen.getByText("Overview")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "In-depth analytics and insights" })).toBeTruthy();
    expect(screen.getByText("Download counts and trend information")).toBeTruthy();
  });

  it("wraps contained section content and supports surfaced mode", () => {
    const { container } = render(
      <SectionShell surfaced>
        <div>Section content</div>
      </SectionShell>,
    );

    expect(screen.getByText("Section content")).toBeTruthy();
    expect(container.querySelector("section")?.className).toContain("border-y");
  });

  it("applies reverse desktop ordering when requested", () => {
    const { container } = render(
      <TwoColumnSection reverseOnDesktop left={<div>left</div>} right={<div>right</div>} />,
    );

    const wrappers = container.querySelectorAll(".order-2");
    expect(wrappers.length).toBe(1);
    expect(screen.getByText("left")).toBeTruthy();
    expect(screen.getByText("right")).toBeTruthy();
  });
});
