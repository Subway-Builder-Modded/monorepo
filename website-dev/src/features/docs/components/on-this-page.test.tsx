import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnThisPage } from "@/features/docs/components/on-this-page";

function setHeadingTop(id: string, top: number) {
  const node = document.getElementById(id) as HTMLElement | null;
  if (!node) return;

  node.getBoundingClientRect = vi.fn(() => ({
    top,
    bottom: top + 24,
    left: 0,
    right: 300,
    width: 300,
    height: 24,
    x: 0,
    y: top,
    toJSON: () => ({}),
  })) as unknown as () => DOMRect;
}

describe("OnThisPage", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <h2 id="intro">Intro</h2>
      <h3 id="setup">Setup</h3>
      <h4 id="advanced">Advanced</h4>
      <h5 id="ignored">Ignored</h5>
    `;

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 0,
    });

    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    setHeadingTop("intro", 24);
    setHeadingTop("setup", 260);
    setHeadingTop("advanced", 520);
  });

  it("remains visible with no headings and uses plain empty-state text", () => {
    render(<OnThisPage headings={[]} rawContent={"## Intro"} />);

    expect(screen.getByText("On This Page")).toBeInTheDocument();
    const empty = screen.getByText("No sections on this page.");
    expect(empty.className).not.toContain("bg-");
    expect(screen.getByRole("button", { name: /Top/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copy/i })).toBeInTheDocument();
  });

  it("renders only h2-h4 section links", () => {
    render(
      <OnThisPage
        headings={[
          { id: "intro", text: "Intro", level: 2 },
          { id: "setup", text: "Setup", level: 3 },
          { id: "advanced", text: "Advanced", level: 4 },
          { id: "ignored", text: "Ignored", level: 5 },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "Intro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Setup" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Advanced" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ignored" })).not.toBeInTheDocument();
  });

  it("scrolls reliably to section targets when links are clicked", async () => {
    const user = userEvent.setup();

    render(<OnThisPage headings={[{ id: "setup", text: "Setup", level: 3 }]} />);

    await user.click(screen.getByRole("button", { name: "Setup" }));

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 164,
      behavior: "smooth",
    });
  });

  it("updates active section from scroll position changes", async () => {
    render(
      <OnThisPage
        headings={[
          { id: "intro", text: "Intro", level: 2 },
          { id: "setup", text: "Setup", level: 3 },
        ]}
      />,
    );

    const intro = screen.getByRole("button", { name: "Intro" });
    const setup = screen.getByRole("button", { name: "Setup" });

    expect(intro.className).toContain("text-[var(--suite-accent-light)]");

    setHeadingTop("intro", -300);
    setHeadingTop("setup", 60);
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(setup.className).toContain("text-[var(--suite-accent-light)]");
    });
  });

  it("keeps Top/Edit/Copy controls neutral and borderless by default", () => {
    render(
      <OnThisPage
        headings={[{ id: "intro", text: "Intro", level: 2 }]}
        editUrl="https://github.com/Subway-Builder-Modded/monorepo"
        rawContent="## Intro"
      />,
    );

    const top = screen.getByRole("button", { name: /Top/i });
    const edit = screen.getByRole("link", { name: /Edit/i });
    const copy = screen.getByRole("button", { name: /Copy/i });

    expect(top.className).toContain("text-muted-foreground");
    expect(edit.className).toContain("text-muted-foreground");
    expect(copy.className).toContain("text-muted-foreground");
    expect(top.className).not.toContain("border");
    expect(edit.className).not.toContain("border");
    expect(copy.className).not.toContain("border");
  });

  it("hides headings whose target is not rendered (e.g. inside an inactive tab) and re-includes them on tab change", async () => {
    document.body.innerHTML = `
      <article>
        <h2 id="intro">Intro</h2>
        <h2 id="setup">Setup</h2>
      </article>
    `;
    setHeadingTop("intro", 24);
    setHeadingTop("setup", 260);

    render(
      <OnThisPage
        headings={[
          { id: "intro", text: "Intro", level: 2 },
          { id: "tab-only", text: "Tab Only", level: 2 },
          { id: "setup", text: "Setup", level: 2 },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Tab Only" })).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Intro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Setup" })).toBeInTheDocument();

    const article = document.querySelector("article")!;
    const newHeading = document.createElement("h2");
    newHeading.id = "tab-only";
    newHeading.textContent = "Tab Only";
    article.appendChild(newHeading);
    setHeadingTop("tab-only", 600);

    window.dispatchEvent(new Event("sbm-docs-content-change"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Tab Only" })).toBeInTheDocument();
    });
  });

  it("excludes headings that exist under hidden tab panels and includes them when panel becomes visible", async () => {
    document.body.innerHTML = `
      <article>
        <h2 id="intro">Intro</h2>
        <div role="tabpanel" hidden>
          <h2 id="hidden-panel-heading">Hidden Panel Heading</h2>
        </div>
      </article>
    `;

    setHeadingTop("intro", 24);
    setHeadingTop("hidden-panel-heading", 300);

    render(
      <OnThisPage
        headings={[
          { id: "intro", text: "Intro", level: 2 },
          { id: "hidden-panel-heading", text: "Hidden Panel Heading", level: 2 },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Intro" })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Hidden Panel Heading" }),
      ).not.toBeInTheDocument();
    });

    const panel = document.querySelector("[role='tabpanel']") as HTMLElement;
    panel.hidden = false;
    window.dispatchEvent(new Event("sbm-docs-content-change"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Hidden Panel Heading" })).toBeInTheDocument();
    });
  });
});
