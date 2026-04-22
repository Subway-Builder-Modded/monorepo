import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteLayout } from "@/shell";

const mockUseLocation = vi.fn(() => ({ pathname: "/", search: "" }));

vi.mock("@/lib/router", () => ({
  useLocation: () => mockUseLocation(),
}));

vi.mock("@/config/site-navigation", () => ({
  getActiveSuite: () => ({ colorSchemeId: "railyard" }),
}));

vi.mock("@/hooks/use-theme-mode", () => ({
  useThemeMode: () => ({ theme: "light", setTheme: vi.fn() }),
}));

vi.mock("@/hooks/use-page-metadata", () => ({
  usePageMetadata: vi.fn(),
}));

vi.mock("@/shared/navigation/floating-navbar", () => ({
  FloatingNavbar: () => <nav data-testid="floating-navbar" />,
}));

vi.mock("@/shared/footer/site-footer", () => ({
  SiteFooter: () => <footer data-testid="site-footer" />,
}));

describe("SiteLayout", () => {
  beforeEach(() => {
    mockUseLocation.mockReturnValue({ pathname: "/", search: "" });
  });

  it("applies shared shell bounds on homepage and docs routes without extra bottom padding", () => {
    const { rerender } = render(
      <SiteLayout>
        <div>child</div>
      </SiteLayout>,
    );

    const mainAtHome = screen.getByText("child").closest("main");
    expect(mainAtHome?.className).toContain("mx-auto");
    expect(mainAtHome?.className).toContain("px-5");
    // No pb-8 on main: sections and pages control their own bottom spacing,
    // preventing a background-colored strip between the last section and the footer.
    expect(mainAtHome?.className).not.toContain("pb-8");

    mockUseLocation.mockReturnValue({ pathname: "/railyard/docs", search: "" });
    rerender(
      <SiteLayout>
        <div>child</div>
      </SiteLayout>,
    );

    const mainAtDocs = screen.getByText("child").closest("main");
    expect(mainAtDocs?.className).toContain("mx-auto");
    expect(mainAtDocs?.className).toContain("px-5");
  });
});
