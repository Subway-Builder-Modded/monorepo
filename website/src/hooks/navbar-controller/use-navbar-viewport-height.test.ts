import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useNavbarViewportHeight } from "@/hooks/navbar-controller/use-navbar-viewport-height";

describe("useNavbarViewportHeight", () => {
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerHeight", {
      value: originalInnerHeight,
      writable: true,
      configurable: true,
    });
  });

  it("returns window.innerHeight on mount", () => {
    const { result } = renderHook(() => useNavbarViewportHeight());
    expect(result.current).toBe(800);
  });

  it("updates when the window is resized to a smaller height", () => {
    const { result } = renderHook(() => useNavbarViewportHeight());

    act(() => {
      Object.defineProperty(window, "innerHeight", {
        value: 500,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(500);
  });

  it("updates when the window is resized to a larger height", () => {
    const { result } = renderHook(() => useNavbarViewportHeight());

    act(() => {
      Object.defineProperty(window, "innerHeight", {
        value: 1200,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(1200);
  });

  it("reflects multiple sequential resize events", () => {
    const { result } = renderHook(() => useNavbarViewportHeight());

    act(() => {
      Object.defineProperty(window, "innerHeight", {
        value: 600,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(600);

    act(() => {
      Object.defineProperty(window, "innerHeight", {
        value: 1024,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(1024);
  });
});
