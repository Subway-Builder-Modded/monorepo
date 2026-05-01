import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import App from "@/app";

const mockUseLocation = vi.fn();

vi.mock("@/lib/router", () => ({
  useLocation: () => mockUseLocation(),
}));

vi.mock("@/shell", () => ({
  SiteLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/features/home", () => ({
  HomePage: () => <h1>Home page</h1>,
}));

vi.mock("@/features/not-found", () => ({
  NotFoundPage: () => <h1>Page not found</h1>,
}));

vi.mock("@/features/docs", () => ({
  DocsRoute: () => null,
  matchDocsRoute: () => ({ kind: "none" }),
}));

vi.mock("@/features/updates", () => ({
  UpdatesRoute: () => null,
  matchUpdatesRoute: () => ({ kind: "none" }),
}));

vi.mock("@/features/license", () => ({
  LicenseRoute: () => null,
  matchLicenseRoute: () => ({ kind: "none" }),
}));

vi.mock("@/features/credits", () => ({
  CreditsRoute: () => null,
  matchCreditsRoute: () => ({ kind: "none" }),
}));

vi.mock("@/features/contribute", () => ({
  ContributeRoute: () => null,
  matchContributeRoute: () => ({ kind: "none" }),
}));

vi.mock("@/features/community", () => ({
  CommunityRoute: () => null,
  matchCommunityRoute: () => ({ kind: "none" }),
}));

vi.mock("@/features/markdown-playground", () => ({
  MarkdownPlaygroundRoute: () => null,
  matchMarkdownPlaygroundRoute: () => ({ kind: "none" }),
}));

vi.mock("@/features/template-mod", () => ({
  TemplateModRoute: () => null,
  matchTemplateModRoute: () => ({ kind: "none" }),
}));

vi.mock("@/features/railyard", () => ({
  RailyardRoute: () => null,
  matchRailyardRoute: () => ({ kind: "none" }),
}));

vi.mock("@/features/depot", () => ({
  DepotRoute: () => null,
  matchDepotRoute: () => ({ kind: "none" }),
}));

describe("App route fallback", () => {
  it("renders home page for root route", () => {
    mockUseLocation.mockReturnValue({ pathname: "/", search: "", hash: "" });

    render(<App />);

    expect(screen.getByRole("heading", { name: "Home page" })).toBeInTheDocument();
  });

  it("renders not-found page for unmatched routes", () => {
    mockUseLocation.mockReturnValue({
      pathname: "/route-that-does-not-exist",
      search: "",
      hash: "",
    });

    render(<App />);

    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
});
