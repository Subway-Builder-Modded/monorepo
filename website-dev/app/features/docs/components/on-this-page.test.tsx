import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { OnThisPage } from "@/app/features/docs/components/on-this-page";

class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly root: Element | Document | null = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0];

  private readonly callback: IntersectionObserverCallback;
  private readonly targets = new Set<Element>();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  static fire(id: string) {
    for (const instance of MockIntersectionObserver.instances) {
      const target = [...instance.targets].find((item) => (item as HTMLElement).id === id);
      if (!target) continue;
      instance.callback(
        [
          {
            target,
            isIntersecting: true,
            intersectionRatio: 1,
            boundingClientRect: target.getBoundingClientRect(),
            intersectionRect: target.getBoundingClientRect(),
            rootBounds: null,
            time: Date.now(),
          } as IntersectionObserverEntry,
        ],
        instance,
      );
    }
  }

  disconnect() {
    this.targets.clear();
  }

  observe(target: Element) {
    this.targets.add(target);
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve(target: Element) {
    this.targets.delete(target);
  }
}

describe("OnThisPage", () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    Object.defineProperty(window, "IntersectionObserver", {
      writable: true,
      value: MockIntersectionObserver,
    });

    document.body.innerHTML = `
      <h2 id="intro">Intro</h2>
      <h3 id="setup">Setup</h3>
      <h4 id="advanced">Advanced</h4>
      <h5 id="ignored">Ignored</h5>
    `;

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders as a medium+ desktop rail and filters to h2-h4 headings only", () => {
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

    const aside = screen.getByText("On This Page").closest("aside");
    expect(aside?.className).toContain("hidden");
    expect(aside?.className).toContain("lg:block");

    expect(screen.getByRole("button", { name: "Intro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Setup" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Advanced" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ignored" })).not.toBeInTheDocument();
  });

  it("renders quick actions and supports copy action", async () => {
    const user = userEvent.setup();

    render(
      <OnThisPage
        headings={[{ id: "intro", text: "Intro", level: 2 }]}
        editUrl="https://github.com/Subway-Builder-Modded/monorepo"
        rawContent="## Intro\n\nBody"
      />,
    );

    expect(screen.getByRole("button", { name: /Top/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Edit/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Copy/i }));
    expect(screen.getByRole("button", { name: /Copied/i })).toBeInTheDocument();
  });

  it("tracks active heading and applies suite-themed active state", async () => {
    render(
      <OnThisPage
        headings={[
          { id: "intro", text: "Intro", level: 2 },
          { id: "setup", text: "Setup", level: 3 },
        ]}
      />,
    );

    MockIntersectionObserver.fire("setup");

    const activeButton = screen.getByRole("button", { name: "Setup" });
    await waitFor(() => {
      expect(activeButton.className).toContain("text-[var(--suite-accent-light)]");
    });
  });
});
