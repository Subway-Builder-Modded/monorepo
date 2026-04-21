import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { getSuiteById } from "@/app/config/site-navigation";
import { NavbarTopbar } from "@/app/components/navigation/navbar-topbar";

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
});
