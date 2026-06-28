import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NAVBAR_MOTION, useNavbarPhase } from "@/hooks/use-navbar-phase";

describe("useNavbarPhase", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reopens when open is requested during closing", () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useNavbarPhase({ canStartEnterMotion: true }));

    act(() => {
      result.current.open();
    });

    expect(result.current.phase).toBe("opening");

    act(() => {
      result.current.close();
    });

    expect(result.current.phase).toBe("closing");

    act(() => {
      result.current.open();
    });

    expect(result.current.phase).toBe("opening");

    act(() => {
      vi.advanceTimersByTime(NAVBAR_MOTION.closeSettleMs + NAVBAR_MOTION.frameExpandMs + 10);
    });

    expect(result.current.phase).toBe("open");
  });
});
