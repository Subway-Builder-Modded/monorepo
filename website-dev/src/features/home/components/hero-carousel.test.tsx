import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroCarousel } from "@/features/home/components/hero-carousel";
import { HERO_AUTO_ROTATE_MS, HERO_TITLE_LINE_1, HERO_TITLE_LINE_2 } from "@/config/home";

describe("HeroCarousel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("auto-rotates slides on interval", () => {
    render(<HeroCarousel />);
    const tabs = screen.getAllByRole("tab");

    expect(tabs[0]).toHaveAttribute("aria-selected", "true");

    act(() => {
      vi.advanceTimersByTime(HERO_AUTO_ROTATE_MS + 5);
    });

    const updatedTabs = screen.getAllByRole("tab");
    expect(updatedTabs[1]).toHaveAttribute("aria-selected", "true");
  });

  it("pauses auto-rotation while the carousel is hovered", () => {
    const { container } = render(<HeroCarousel />);

    const carousel = container.querySelector("section");
    expect(carousel).toBeTruthy();
    fireEvent.mouseEnter(carousel as HTMLElement);

    act(() => {
      vi.advanceTimersByTime(HERO_AUTO_ROTATE_MS + 5);
    });

    expect(screen.getAllByRole("tab")[0]).toHaveAttribute("aria-selected", "true");
  });

  it("supports keyboard slide navigation while focused within the carousel", () => {
    render(<HeroCarousel />);

    const firstTab = screen.getAllByRole("tab")[0];
    firstTab.focus();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getAllByRole("tab")[1]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getAllByRole("tab")[0]).toHaveAttribute("aria-selected", "true");

    expect(
      screen.getByRole("heading", { name: `${HERO_TITLE_LINE_1} ${HERO_TITLE_LINE_2}` }),
    ).toBeVisible();
  });
});
