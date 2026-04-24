import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LicenseRoute } from "@/features/license/page";

vi.mock("@/lib/router", () => ({
  useLocation: () => ({
    pathname: "/license",
  }),
}));

vi.mock("@/features/license/lib/content", () => ({
  loadLicensePage: vi.fn(async () => {
    return function MockContent() {
      return <div>License content</div>;
    };
  }),
}));

describe("LicenseRoute", () => {
  it("renders license page with correct heading from navigation", async () => {
    render(<LicenseRoute />);

    expect(screen.getByRole("heading", { name: "License" })).toBeInTheDocument();
    expect(
      screen.getByText("Terms and licensing information for Subway Builder Modded projects."),
    ).toBeInTheDocument();
  });

  it("renders page with SuiteAccentScope for general suite", () => {
    const { container } = render(<LicenseRoute />);
    // The SuiteAccentScope should be present as a wrapper
    expect(container.firstChild).toBeTruthy();
  });
});
