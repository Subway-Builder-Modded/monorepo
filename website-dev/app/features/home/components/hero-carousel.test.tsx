import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { HeroCarousel } from "@/app/features/home/components/hero-carousel";
import {
  HERO_AUTO_ROTATE_MS,
  HERO_SLIDES,
  HERO_TITLE_LINE_1,
  HERO_TITLE_LINE_2,
} from "@/app/config/home";

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

    expect(screen.getByRole("tab", { name: "Slide 1" })).toHaveAttribute("aria-selected", "true");

    act(() => {
      vi.advanceTimersByTime(HERO_AUTO_ROTATE_MS + 5);
    });

    expect(screen.getByRole("tab", { name: "Slide 2" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText(HERO_SLIDES[1].alt)).toBeVisible();
  });

  it("pauses auto-rotation while the carousel is hovered", () => {
    render(<HeroCarousel />);

    const carousel = screen.getByLabelText("Hero showcase");
    fireEvent.mouseEnter(carousel);

    act(() => {
      vi.advanceTimersByTime(HERO_AUTO_ROTATE_MS + 5);
    });

    expect(screen.getByRole("tab", { name: "Slide 1" })).toHaveAttribute("aria-selected", "true");
  });

  it("supports keyboard slide navigation while focused within the carousel", () => {
    render(<HeroCarousel />);

    const firstTab = screen.getByRole("tab", { name: "Slide 1" });
    firstTab.focus();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Slide 2" })).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "Slide 1" })).toHaveAttribute("aria-selected", "true");

    expect(
      screen.getByRole("heading", { name: `${HERO_TITLE_LINE_1} ${HERO_TITLE_LINE_2}` }),
    ).toBeVisible();
  });
});
