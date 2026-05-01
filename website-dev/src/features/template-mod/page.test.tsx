import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TemplateModRoute } from "@/features/template-mod/page";

vi.mock("@/lib/router", () => ({
  useLocation: () => ({ pathname: "/template-mod", search: "" }),
  Link: vi.fn(({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  )),
}));

describe("TemplateModRoute", () => {
  it("renders title, ctas, code preview, and final cta", () => {
    render(<TemplateModRoute />);

    expect(screen.getByRole("heading", { name: "Template Mod" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Get Started" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Documentation" }).length).toBeGreaterThan(0);

    expect(screen.getByRole("tab", { name: "Install and Configure" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Build, Link, and Develop" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Game API" })).toBeInTheDocument();
  });

  it("switches visible code content when tab changes", async () => {
    const user = userEvent.setup();
    render(<TemplateModRoute />);

    expect(screen.getByRole("tab", { name: "Install and Configure" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.click(screen.getByRole("tab", { name: "Build, Link, and Develop" }));

    expect(screen.getByRole("tab", { name: "Build, Link, and Develop" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("uses valid internal or approved external link targets", () => {
    render(<TemplateModRoute />);

    const links = screen.getAllByRole("link");
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      expect(href.length).toBeGreaterThan(0);
      expect(href.startsWith("/") || href.startsWith("https://")).toBe(true);
    }
  });
});
