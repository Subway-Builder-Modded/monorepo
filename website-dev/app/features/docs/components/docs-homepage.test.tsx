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

vi.mock("@subway-builder-modded/shared-ui", async () => {
  const actual = await vi.importActual<typeof import("@subway-builder-modded/shared-ui")>(
    "@subway-builder-modded/shared-ui",
  );

  return {
    ...actual,
    PageHeading: ({
      title,
      actions,
      badge,
    }: {
      title: string;
      actions?: React.ReactNode;
      badge?: React.ReactNode;
    }) => (
      <div data-testid="shared-page-heading">
        <h1>{title}</h1>
        {badge}
        {actions}
      </div>
    ),
  };
});

describe("DocsHomepage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses shared page heading with suite badge and version chooser for versioned suites", async () => {
    const user = userEvent.setup();
    const pushStateSpy = vi.spyOn(window.history, "pushState");

    render(<DocsHomepage suiteId="railyard" version="v0.1" />);

    expect(screen.getByTestId("shared-page-heading")).toBeInTheDocument();
    expect(screen.getByText("Railyard").closest('[data-slot="suite-badge"]')).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Choose documentation version" }),
    ).toBeInTheDocument();

    expect(screen.queryByRole("link", { name: "v0.1" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "v0.2" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Choose documentation version" }));
    await user.click(screen.getByRole("option", { name: /v0.2/i }));

    expect(pushStateSpy).toHaveBeenCalledWith({}, "", "/railyard/docs?version=v0.2");
  });

  it("renders route-board divider and responsive nav-row card grid", () => {
    const { container } = render(<DocsHomepage suiteId="railyard" version="v0.2" />);

    expect(screen.getByText("Route Board")).toBeInTheDocument();
    expect(screen.queryByText("Start Here")).not.toBeInTheDocument();

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

  it("renders deprecated banner with a latest-switch CTA hint", () => {
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
