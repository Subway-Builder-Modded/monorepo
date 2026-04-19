import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { HeroCreditsTooltip } from "@/app/features/home/components/hero-credits-tooltip";
import { HERO_SLIDES } from "@/app/features/home/data/homepage-content";

describe("HeroCreditsTooltip", () => {
  const slide = HERO_SLIDES[0];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("shows expected map and mod metadata", () => {
    render(<HeroCreditsTooltip slide={slide} />);

    const button = screen.getByRole("button", { name: /image credits/i });
    fireEvent.mouseEnter(button.parentElement as HTMLElement);

    const tooltip = screen.getByRole("tooltip");
    expect(within(tooltip).getByText("Map Details")).toBeVisible();
    expect(within(tooltip).getByText(slide.mapName as string)).toBeVisible();
    expect(within(tooltip).getByText(slide.mods?.[0].name as string)).toBeVisible();
    expect(within(tooltip).getByRole("link", { name: slide.mapName as string })).toHaveAttribute(
      "href",
      `/railyard/browse/maps/${slide.mapId}`,
    );
  });

  it("keeps tooltip stable while transitioning through the hover region", () => {
    render(<HeroCreditsTooltip slide={slide} />);

    const button = screen.getByRole("button", { name: /image credits/i });
    const container = button.parentElement as HTMLElement;

    fireEvent.mouseEnter(container);
    expect(screen.getByRole("tooltip")).toBeVisible();

    fireEvent.mouseLeave(container);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole("tooltip")).toBeVisible();

    fireEvent.mouseEnter(screen.getByRole("tooltip"));

    act(() => {
      vi.advanceTimersByTime(80);
    });
    expect(screen.getByRole("tooltip")).toBeVisible();
  });

  it("supports pin/unpin, outside-click close, and Escape close", () => {
    render(<HeroCreditsTooltip slide={slide} />);

    const button = screen.getByRole("button", { name: /image credits/i });
    const container = button.parentElement as HTMLElement;

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    fireEvent.mouseLeave(container);
    act(() => {
      vi.advanceTimersByTime(220);
    });
    expect(screen.getByRole("tooltip")).toBeVisible();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("tooltip")).toBeNull();

    fireEvent.click(button);
    expect(screen.getByRole("tooltip")).toBeVisible();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
