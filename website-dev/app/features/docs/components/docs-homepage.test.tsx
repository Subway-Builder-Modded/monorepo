import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { DocsHomepage } from "@/app/features/docs/components/docs-homepage";

vi.mock("@/app/lib/router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/features/docs/lib/content", () => ({
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

vi.mock("@/app/features/docs/lib/icon-resolver", () => ({
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

  it("renders route-board divider and responsive nav-row card grid", () => {
    const { container } = render(<DocsHomepage suiteId="railyard" version="v0.2" />);

    expect(screen.getByText("Discover")).toBeInTheDocument();

    const cardsLink = screen.getByRole("link", { name: /Players/i });
    expect(cardsLink.className).toContain("var(--suite-accent-light)");

    const cardsGrid = container.querySelector(".grid");
    expect(cardsGrid?.className).toContain("minmax(14.5rem,1fr)");

    expect(screen.getByRole("button", { name: "Choose documentation version" })).toBeInTheDocument();
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

  it("renders stacked utility-style hero actions with configured icons", () => {
    render(<DocsHomepage suiteId="railyard" version="v0.2" />);

    const heading = screen.getByRole("heading", { level: 1 });
    const versionBtn = screen.getByRole("button", { name: "Choose documentation version" });
    const heroCard = heading.closest(".rounded-3xl");

    expect(heroCard).toBeTruthy();
    expect(heroCard?.contains(versionBtn)).toBe(true);

    const download = screen.getByRole("link", { name: /Download Railyard/i });
    const source = screen.getByRole("link", { name: /Railyard Source/i });

    expect(download.className).toContain("h-7");
    expect(download.className).toContain("text-[11px]");
    expect(download.querySelector("svg")).toBeTruthy();

    const actionsWrap = download.parentElement;
    expect(actionsWrap?.className).toContain("flex-col");
    expect(actionsWrap?.contains(source)).toBe(true);
  });

  it("renders deprecated banner with latest-version button target", () => {
    render(<DocsHomepage suiteId="railyard" version="v0.1" />);

    const banner = screen.getByText(/which is deprecated/i).closest("div");
    expect(banner).toBeTruthy();
    expect(
      within(banner as HTMLElement).getByText(/switching to the latest version/i),
    ).toBeInTheDocument();
    expect(within(banner as HTMLElement).getByRole("link", { name: "View Latest Version" })).toHaveAttribute(
      "href",
      "/railyard/docs?version=v0.2",
    );
  });
});
