import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocsHomepage } from "@/features/docs/components/docs-homepage";

vi.mock("@/lib/router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/docs/lib/content", () => ({
  getDocsTree: vi.fn(() => ({
    suiteId: "railyard",
    version: "v0.2",
    nodes: [
      {
        kind: "page",
        key: "players",
        slug: "players",
        routePath: "/railyard/docs/v0.2/players",
        sourcePath: "/content/docs/railyard/v0.2/players.mdx",
        frontmatter: {
          title: "Players",
          description: "Player management docs",
          icon: "FileText",
        },
        suiteId: "railyard",
        version: "v0.2",
        children: [],
        depth: 0,
      },
    ],
  })),
  getVisibleNodes: vi.fn((nodes) => nodes),
  findTreeNode: vi.fn(() => null),
}));

vi.mock("@/features/docs/lib/icon-resolver", () => ({
  resolveIcon: () => (props: { className?: string }) => <svg data-testid="card-icon" {...props} />,
}));

describe("DocsHomepage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a single hero surface with h1, suite badge, and in-card version chooser", async () => {
    const user = userEvent.setup();
    const pushStateSpy = vi.spyOn(window.history, "pushState");

    render(<DocsHomepage suiteId="railyard" version="v0.1" />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Railyard").closest('[data-slot="suite-badge"]')).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Choose documentation version" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("docs-homepage-hero-icon")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Choose documentation version" }));
    await user.click(screen.getByRole("option", { name: /v0.2/i }));

    expect(pushStateSpy).toHaveBeenCalledWith({}, "", "/railyard/docs?version=v0.2");
  });

  it("renders the DIRECTORY separator and a responsive card grid (max 4 columns)", () => {
    const { container } = render(<DocsHomepage suiteId="railyard" version="v0.2" />);

    // DIRECTORY separator must be present with its label text.
    expect(screen.getByText("Directory")).toBeInTheDocument();
    expect(screen.getByTestId("directory-separator")).toBeInTheDocument();

    const cardsLink = screen.getByRole("link", { name: /Players/i });
    expect(cardsLink.className).toContain("var(--suite-accent-light)");

    // Grid is capped at 4 columns via explicit responsive breakpoints.
    const cardsGrid = container.querySelector(".xl\\:grid-cols-4");
    expect(cardsGrid).toBeTruthy();

    expect(
      screen.getByRole("button", { name: "Choose documentation version" }),
    ).toBeInTheDocument();
  });

  it("shows no version UI for non-versioned registry", () => {
    render(<DocsHomepage suiteId="registry" version={null} />);

    expect(
      screen.queryByRole("button", { name: "Choose documentation version" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("LATEST")).not.toBeInTheDocument();
    expect(screen.queryByText("DEPRECATED")).not.toBeInTheDocument();

    const cards = screen.getAllByRole("link");
    const cardsRegion = cards.find((link) =>
      link.getAttribute("href")?.startsWith("/registry/docs/"),
    );
    expect(cardsRegion).toBeTruthy();
  });

  it("renders stacked, right-aligned utility-style hero actions with configured icons", () => {
    render(<DocsHomepage suiteId="railyard" version="v0.2" />);

    const heading = screen.getByRole("heading", { level: 1 });
    const versionBtn = screen.getByRole("button", { name: "Choose documentation version" });
    const heroCard = heading.closest(".rounded-2xl");

    expect(heroCard).toBeTruthy();
    expect(heroCard?.contains(versionBtn)).toBe(true);

    const download = screen.getByRole("link", { name: /Download Railyard/i });
    const analytics = screen.getByRole("link", { name: /View Analytics/i });

    expect(download.className).toContain("h-7");
    expect(download.className).toContain("text-[11px]");
    expect(download.querySelector("svg")).toBeTruthy();

    const actionsWrap = download.parentElement;
    expect(actionsWrap?.className).toContain("flex-col");
    // Actions stack must be right-aligned (items aligned to the end of the
    // column) so they read as utility actions and not left-justified buttons.
    expect(actionsWrap?.className).toContain("items-end");
    expect(actionsWrap?.contains(analytics)).toBe(true);
  });

  it("renders deprecated banner with latest-version button target", () => {
    render(<DocsHomepage suiteId="railyard" version="v0.1" />);

    const banner = screen.getByText(/which is deprecated/i).closest("div");
    expect(banner).toBeTruthy();
    expect(
      within(banner as HTMLElement).getByText(/switching to the latest version/i),
    ).toBeInTheDocument();
    expect(
      within(banner as HTMLElement).getByRole("link", { name: "View Latest Version" }),
    ).toHaveAttribute("href", "/railyard/docs?version=v0.2");
  });

  it("hero title and icon are sourced from shared identity (not duplicated per suite docs config)", () => {
    render(<DocsHomepage suiteId="railyard" version="v0.2" />);

    // Title is the shared docs identity. Suite identity is reflected in the
    // adjacent SuiteBadge, never redeclared per suite docs config.
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Documentation");
    expect(screen.getByText("Railyard").closest('[data-slot="suite-badge"]')).toBeTruthy();

    // Icon is the shared docs identity icon.
    expect(screen.getByTestId("docs-homepage-hero-icon")).toBeInTheDocument();
  });

  it("hero description is sourced from the shared site-navigation docs entry", () => {
    render(<DocsHomepage suiteId="railyard" version="v0.2" />);
    expect(
      screen.getByText("The official documentation for the Railyard app."),
    ).toBeInTheDocument();
  });
});
