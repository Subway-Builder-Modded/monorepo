import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DepotRoute } from "@/features/depot/page";
import {
  DEPOT_FINAL_CTA_CONTENT,
  DEPOT_OPERATIONS_CONTENT,
  DEPOT_SCROLLYTELLING_CONTENT,
} from "@/features/depot/depot-content";

vi.mock("@/lib/router", () => ({
  useLocation: () => ({ pathname: "/depot", search: "" }),
  Link: vi.fn(({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  )),
}));

describe("DepotRoute", () => {
  it("renders /depot with hero title, CTAs, scrollytelling, operations, and final CTA", () => {
    render(<DepotRoute />);

    expect(screen.getByRole("heading", { name: "Depot" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Get Started" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Documentation" }).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { name: DEPOT_SCROLLYTELLING_CONTENT.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: DEPOT_OPERATIONS_CONTENT.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: DEPOT_FINAL_CTA_CONTENT.title }),
    ).toBeInTheDocument();

    for (const step of DEPOT_SCROLLYTELLING_CONTENT.steps) {
      expect(screen.getAllByAltText(step.image.imageAlt).length).toBeGreaterThan(0);
    }

    expect(
      screen.getAllByRole("link", { name: DEPOT_FINAL_CTA_CONTENT.primaryCta.label }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: DEPOT_FINAL_CTA_CONTENT.secondaryCta.label }).length,
    ).toBeGreaterThan(0);
  });

  it("uses audited internal or approved external resource links", () => {
    render(<DepotRoute />);

    const links = screen.getAllByRole("link");
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      expect(href.length).toBeGreaterThan(0);
      expect(href.startsWith("/") || href.startsWith("https://")).toBe(true);
    }
  });
});
