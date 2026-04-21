import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { SiteLayout } from "@/app/components/layout/site-layout";

const mockUseLocation = vi.fn(() => ({ pathname: "/", search: "" }));

vi.mock("@/app/lib/router", () => ({
  useLocation: () => mockUseLocation(),
}));

vi.mock("@/app/config/site-navigation", () => ({
  getActiveSuite: () => ({ colorSchemeId: "railyard" }),
}));

vi.mock("@/app/hooks/use-theme-mode", () => ({
  useThemeMode: () => ({ theme: "light", setTheme: vi.fn() }),
}));

vi.mock("@/app/hooks/use-page-metadata", () => ({
  usePageMetadata: vi.fn(),
}));

vi.mock("@/app/components/navigation/floating-navbar", () => ({
  FloatingNavbar: () => <nav data-testid="floating-navbar" />,
}));

vi.mock("@/app/components/footer/site-footer", () => ({
  SiteFooter: () => <footer data-testid="site-footer" />,
}));

describe("SiteLayout", () => {
  beforeEach(() => {
    mockUseLocation.mockReturnValue({ pathname: "/", search: "" });
  });

  it("applies shared shell bounds on homepage and docs routes", () => {
    const { rerender } = render(
      <SiteLayout>
        <div>child</div>
      </SiteLayout>,
    );

    const mainAtHome = screen.getByText("child").closest("main");
    expect(mainAtHome?.className).toContain("mx-auto");
    expect(mainAtHome?.className).toContain("px-5");

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
