import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNavbarEscapeKey } from "@/hooks/navbar-controller/use-navbar-escape-key";

describe("useNavbarEscapeKey", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not attach a keydown listener when phase is closed", () => {
    const onEscape = vi.fn();
    const addEventListener = vi.spyOn(window, "addEventListener");

    renderHook(() => useNavbarEscapeKey({ onEscape, phase: "closed" }));

    const keydownCalls = addEventListener.mock.calls.filter(([event]) => event === "keydown");
    expect(keydownCalls).toHaveLength(0);
  });

  it("does not fire onEscape when phase is closed and Escape is pressed", () => {
    const onEscape = vi.fn();
    renderHook(() => useNavbarEscapeKey({ onEscape, phase: "closed" }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onEscape).not.toHaveBeenCalled();
  });

  it("fires onEscape when Escape is pressed while phase is open", () => {
    const onEscape = vi.fn();
    renderHook(() => useNavbarEscapeKey({ onEscape, phase: "open" }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("does not fire onEscape for other keys while open", () => {
    const onEscape = vi.fn();
    renderHook(() => useNavbarEscapeKey({ onEscape, phase: "open" }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));

    expect(onEscape).not.toHaveBeenCalled();
  });

  it("fires onEscape when Escape is pressed during opening phase", () => {
    const onEscape = vi.fn();
    renderHook(() => useNavbarEscapeKey({ onEscape, phase: "opening" }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("removes the keydown listener on unmount", () => {
    const onEscape = vi.fn();
    const removeEventListener = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useNavbarEscapeKey({ onEscape, phase: "open" }));
    unmount();

    const keydownRemovals = removeEventListener.mock.calls.filter(([event]) => event === "keydown");
    expect(keydownRemovals.length).toBeGreaterThan(0);
  });

  it("does not fire onEscape after unmount", () => {
    const onEscape = vi.fn();
    const { unmount } = renderHook(() => useNavbarEscapeKey({ onEscape, phase: "open" }));

    unmount();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onEscape).not.toHaveBeenCalled();
  });
});
