import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SiteNavItem } from "@/config/site-navigation";
import { NavbarLinkRow } from "@/shared/navigation/navbar-link-row";

vi.mock("@/lib/router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const ITEM: SiteNavItem = {
  id: "home",
  suiteId: "general",
  title: "Home",
  href: "/",
  icon: () => <svg data-testid="home-icon" aria-hidden />,
  description: "Return to the home page",
};

describe("NavbarLinkRow", () => {
  it("renders the item title and description", () => {
    render(<NavbarLinkRow active={false} item={ITEM} onClick={vi.fn()} />);
    expect(screen.getByText("Home")).toBeVisible();
    expect(screen.getByText("Return to the home page")).toBeVisible();
  });

  it("renders a link pointing to the item href", () => {
    render(<NavbarLinkRow active={false} item={ITEM} onClick={vi.fn()} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/");
  });

  it("sets aria-current=page on the link when active", () => {
    render(<NavbarLinkRow active={true} item={ITEM} onClick={vi.fn()} />);
    expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page");
  });

  it("does not set aria-current on the link when inactive", () => {
    render(<NavbarLinkRow active={false} item={ITEM} onClick={vi.fn()} />);
    expect(screen.getByRole("link")).not.toHaveAttribute("aria-current");
  });

  it("renders the item icon", () => {
    render(<NavbarLinkRow active={false} item={ITEM} onClick={vi.fn()} />);
    expect(screen.getByTestId("home-icon")).toBeInTheDocument();
  });

  it("calls onClick when the link is clicked", () => {
    const onClick = vi.fn();
    render(<NavbarLinkRow active={false} item={ITEM} onClick={onClick} />);
    screen.getByRole("link").click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
