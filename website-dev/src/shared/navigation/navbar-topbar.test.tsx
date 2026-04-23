import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getSuiteById } from "@/config/site-navigation";
import { NavbarTopbar } from "@/shared/navigation/navbar-topbar";

describe("NavbarTopbar", () => {
  it("renders suite indicator and does not render breadcrumb UI", () => {
    render(
      <NavbarTopbar
        isExpanded={false}
        isMobile={false}
        realAccent="#222"
        realSuite={getSuiteById("registry")}
        theme="light"
        onMenuClick={vi.fn()}
        onThemeClick={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Go to home")).toBeVisible();
    expect(screen.getByText("Registry")).toBeVisible();
    expect(screen.queryByRole("navigation", { name: /breadcrumb/i })).toBeNull();

    const suiteBadge = screen.getByText("Registry").closest('[data-slot="suite-badge"]');
    expect(suiteBadge?.className).not.toContain("-translate-y");
  });

  it("uses sufficient line-height on brand text to prevent descender clipping", () => {
    render(
      <NavbarTopbar
        isExpanded={false}
        isMobile={false}
        realAccent="#222"
        realSuite={getSuiteById("railyard")}
        theme="light"
        onMenuClick={vi.fn()}
        onThemeClick={vi.fn()}
      />,
    );

    const brandLink = screen.getByLabelText("Go to home");
    // Find the inner text span (not the overflow-clip wrapper).
    const brandTextSpan = brandLink.querySelector("span > span");
    expect(brandTextSpan).toBeTruthy();
    // Must NOT use the tight leading-[1.08] that clips descenders on letters
    // like 'y' in "Subway". leading-[1.2] or above is required.
    expect(brandTextSpan?.className).not.toContain("leading-[1.08]");
  });
});
