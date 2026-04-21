// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { NavDropdown } from "./nav-dropdown";

afterEach(() => {
  cleanup();
});

describe("NavDropdown", () => {
  it("renders text-first item content with pill after text for trigger and entries", () => {
    render(
      <NavDropdown
        options={[
          {
            id: "v0.2",
            label: "v0.2",
            icon: <span>LATEST</span>,
            tone: {
              color: "var(--suite-accent-light)",
              muted: "color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)",
            },
          },
        ]}
        selectedId="v0.2"
        isOpen={true}
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
        triggerLabel="Choose version"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Choose version" });
    const triggerText = trigger.textContent ?? "";
    expect(triggerText).toContain("v0.2");
    expect(triggerText).toContain("LATEST");
    expect(triggerText.indexOf("v0.2")).toBeLessThan(triggerText.indexOf("LATEST"));

    const option = screen.getAllByRole("option", { name: /v0.2/i })[0];
    const spans = option.querySelectorAll("span");
    expect(spans[0]?.textContent).toBe("v0.2");
    expect(spans[1]?.textContent).toBe("LATEST");
  });

  it("applies tone-aware hover/active classes and supports deprecated gray override", () => {
    render(
      <NavDropdown
        options={[
          {
            id: "v0.2",
            label: "v0.2",
            icon: <span>LATEST</span>,
            tone: {
              color: "var(--suite-accent-light)",
              muted: "color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)",
            },
          },
          {
            id: "v0.1",
            label: "v0.1",
            icon: <span>DEPRECATED</span>,
            tone: {
              color: "hsl(var(--muted-foreground))",
              muted: "hsl(var(--muted))",
            },
          },
        ]}
        selectedId="v0.1"
        isOpen={true}
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
        triggerLabel="Choose version"
      />,
    );

    const latest = screen.getAllByRole("option", { name: /v0.2/i })[0];
    const deprecated = screen.getAllByRole("option", { name: /v0.1/i })[0];

    expect(latest.className).toContain("hover:bg-[var(--option-muted)]");
    expect(latest.className).toContain("hover:text-[var(--option-color)]");
    expect(deprecated.className).toContain("bg-[var(--option-muted)]");
    expect(deprecated.className).toContain("text-[var(--option-color)]");
  });
});
