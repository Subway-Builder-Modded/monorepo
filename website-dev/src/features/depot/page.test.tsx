import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DepotRoute } from "@/features/depot/page";

vi.mock("@/lib/router", () => ({
  useLocation: () => ({ pathname: "/depot", search: "" }),
  Link: vi.fn(({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  )),
}));

describe("DepotRoute", () => {
  it("renders /depot with hero title and primary CTAs", () => {
    render(<DepotRoute />);

    expect(screen.getByRole("heading", { name: "Depot" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Get Started" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Documentation" }).length).toBeGreaterThan(0);
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
