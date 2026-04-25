import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SiteNavItem } from "@/config/site-navigation";
import {
  NavbarPanel,
  NavbarPanelContent,
  NavbarPanelShell,
} from "@/shared/navigation/navbar-panel";

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

const makeItem = (id: string, title: string): SiteNavItem => ({
  id,
  suiteId: "general",
  title,
  href: `/${id}`,
  icon: () => <svg data-testid={`icon-${id}`} aria-hidden />,
  description: `${title} description`,
});

const ITEMS: SiteNavItem[] = [
  makeItem("home", "Home"),
  makeItem("docs", "Docs"),
  makeItem("updates", "Updates"),
];

describe("NavbarPanelContent", () => {
  it("renders all items from the list", () => {
    render(
      <NavbarPanelContent
        items={ITEMS}
        activeItem={null}
        rowsVisible={true}
        prefersReducedMotion={false}
        onRowClick={vi.fn()}
      />,
    );

    expect(screen.getByText("Home")).toBeVisible();
    expect(screen.getByText("Docs")).toBeVisible();
    expect(screen.getByText("Updates")).toBeVisible();
  });

  it("marks the active item link with aria-current=page", () => {
    render(
      <NavbarPanelContent
        items={ITEMS}
        activeItem={ITEMS[1]}
        rowsVisible={true}
        prefersReducedMotion={false}
        onRowClick={vi.fn()}
      />,
    );

    const links = screen.getAllByRole("link");
    const docsLink = links.find((l) => l.getAttribute("href") === "/docs");
    expect(docsLink).toHaveAttribute("aria-current", "page");
  });

  it("does not mark any link as active when activeItem is null", () => {
    render(
      <NavbarPanelContent
        items={ITEMS}
        activeItem={null}
        rowsVisible={true}
        prefersReducedMotion={false}
        onRowClick={vi.fn()}
      />,
    );

    const links = screen.getAllByRole("link");
    for (const link of links) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });

  it("renders items without motion wrapper when enableRowMotion is false", () => {
    render(
      <NavbarPanelContent
        items={ITEMS}
        activeItem={null}
        enableRowMotion={false}
        rowsVisible={true}
        prefersReducedMotion={false}
        onRowClick={vi.fn()}
      />,
    );

    expect(screen.getByText("Home")).toBeVisible();
    expect(screen.getByText("Docs")).toBeVisible();
  });

  it("renders with prefersReducedMotion true without crashing", () => {
    render(
      <NavbarPanelContent
        items={ITEMS}
        activeItem={null}
        rowsVisible={true}
        prefersReducedMotion={true}
        onRowClick={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("link")).toHaveLength(ITEMS.length);
  });

  it("renders with rowsVisible false without crashing", () => {
    render(
      <NavbarPanelContent
        items={ITEMS}
        activeItem={null}
        rowsVisible={false}
        prefersReducedMotion={false}
        onRowClick={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("link")).toHaveLength(ITEMS.length);
  });

  it("renders an empty list without crashing", () => {
    render(
      <NavbarPanelContent
        items={[]}
        activeItem={null}
        rowsVisible={true}
        prefersReducedMotion={false}
        onRowClick={vi.fn()}
      />,
    );

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});

describe("NavbarPanelShell", () => {
  it("renders its children", () => {
    render(
      <NavbarPanelShell accentColor="#ff0000" mutedColor="#eeeeee">
        <span>Shell content</span>
      </NavbarPanelShell>,
    );

    expect(screen.getByText("Shell content")).toBeVisible();
  });
});

describe("NavbarPanel", () => {
  it("renders all items inside the panel shell", () => {
    render(
      <NavbarPanel
        items={ITEMS}
        activeItem={null}
        accentColor="#ff0000"
        mutedColor="#eeeeee"
        rowsVisible={true}
        prefersReducedMotion={false}
        onRowClick={vi.fn()}
      />,
    );

    expect(screen.getByText("Home")).toBeVisible();
    expect(screen.getByText("Docs")).toBeVisible();
    expect(screen.getByText("Updates")).toBeVisible();
  });
});
