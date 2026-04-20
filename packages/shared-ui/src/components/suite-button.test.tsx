// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { Database } from "lucide-react";
import { SuiteButton } from "./suite-button";

const accent = { light: "#0f8f68", dark: "#19d89c" };

describe("SuiteButton", () => {
  it("renders solid button variant with icon alignment classes", () => {
    render(
      <SuiteButton accent={accent} isDark={false} icon={Database}>
        Open analytics
      </SuiteButton>,
    );

    const button = screen.getByRole("button", { name: "Open analytics" });
    expect(button.className).toContain("inline-flex");
    expect(button.className).toContain("items-center");
    expect(button.className).toContain("gap-2");
    expect(button.getAttribute("style")).toContain("background-color");
  });

  it("renders outline anchor variant with suite accent styles", () => {
    render(
      <SuiteButton as="a" href="/registry/analytics" accent={accent} isDark={true} variant="outline">
        Registry analytics
      </SuiteButton>,
    );

    const link = screen.getByRole("link", { name: "Registry analytics" });
    expect(link.getAttribute("href")).toBe("/registry/analytics");
    expect(link.getAttribute("style")).toContain("border-color");
    expect(link.getAttribute("style")).toContain("--suite-btn-hover");
  });
});
