import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNavbarInteractions } from "@/hooks/navbar-controller/use-navbar-interactions";
import type { NavbarPhase } from "@/hooks/use-navbar-phase";

type HookTestProps = {
  isFrameExpanded: boolean;
  phase: NavbarPhase;
};

describe("useNavbarInteractions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not auto-expand on hover when window is unfocused and pointer is offscreen", () => {
    const open = vi.fn();
    const close = vi.fn();

    vi.spyOn(document, "hasFocus").mockReturnValue(false);

    const { result } = renderHook(() =>
      useNavbarInteractions({
        close,
        isFrameExpanded: false,
        open,
        phase: "closed",
        realSuiteId: "general",
        setTheme: vi.fn(),
        theme: "light",
      }),
    );

    act(() => {
      document.dispatchEvent(new Event("pointerleave"));
      window.dispatchEvent(new Event("blur"));
    });

    act(() => {
      result.current.onFrameHoverStart();
    });

    expect(open).toHaveBeenCalledTimes(0);
  });

  it("opens on hover and closes on hover end when not pinned", () => {
    const open = vi.fn();
    const close = vi.fn();

    const { result, rerender } = renderHook<
      ReturnType<typeof useNavbarInteractions>,
      HookTestProps
    >(
      ({ phase, isFrameExpanded }) =>
        useNavbarInteractions({
          close,
          isFrameExpanded,
          open,
          phase,
          realSuiteId: "general",
          setTheme: vi.fn(),
          theme: "light",
        }),
      {
        initialProps: {
          isFrameExpanded: false,
          phase: "closed" as const,
        } satisfies HookTestProps,
      },
    );

    act(() => {
      result.current.onFrameHoverStart();
    });
    expect(open).toHaveBeenCalledTimes(1);

    rerender({
      isFrameExpanded: true,
      phase: "open",
    } satisfies HookTestProps);

    act(() => {
      result.current.onFrameHoverEnd();
    });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("closes when hover ends during opening so quick in-out cannot stick open", () => {
    const open = vi.fn();
    const close = vi.fn();

    const { result } = renderHook(() =>
      useNavbarInteractions({
        close,
        isFrameExpanded: false,
        open,
        phase: "opening",
        realSuiteId: "general",
        setTheme: vi.fn(),
        theme: "light",
      }),
    );

    act(() => {
      result.current.onFrameHoverEnd();
    });

    expect(close).toHaveBeenCalledTimes(1);
  });

  it("reopens when hover starts during closing", () => {
    const open = vi.fn();

    const { result } = renderHook(() =>
      useNavbarInteractions({
        close: vi.fn(),
        isFrameExpanded: false,
        open,
        phase: "closing",
        realSuiteId: "general",
        setTheme: vi.fn(),
        theme: "light",
      }),
    );

    act(() => {
      result.current.onFrameHoverStart();
    });

    expect(open).toHaveBeenCalledTimes(1);
  });

  it("does not reset selected suite when hover starts during opening", () => {
    const open = vi.fn();

    const { result, rerender } = renderHook<
      ReturnType<typeof useNavbarInteractions>,
      HookTestProps
    >(
      ({ phase, isFrameExpanded }) =>
        useNavbarInteractions({
          close: vi.fn(),
          isFrameExpanded,
          open,
          phase,
          realSuiteId: "general",
          setTheme: vi.fn(),
          theme: "light",
        }),
      {
        initialProps: {
          isFrameExpanded: true,
          phase: "open" as const,
        } satisfies HookTestProps,
      },
    );

    act(() => {
      result.current.onSuiteChange("registry");
    });
    expect(result.current.openSuiteId).toBe("registry");

    rerender({
      isFrameExpanded: false,
      phase: "opening",
    } satisfies HookTestProps);

    act(() => {
      result.current.onFrameHoverStart();
    });

    expect(open).toHaveBeenCalledTimes(0);
    expect(result.current.openSuiteId).toBe("registry");
  });

  it("keeps hover-close disabled while pinned and supports menu toggle close", () => {
    const open = vi.fn();
    const close = vi.fn();

    const { result, rerender } = renderHook<
      ReturnType<typeof useNavbarInteractions>,
      HookTestProps
    >(
      ({ phase, isFrameExpanded }) =>
        useNavbarInteractions({
          close,
          isFrameExpanded,
          open,
          phase,
          realSuiteId: "general",
          setTheme: vi.fn(),
          theme: "light",
        }),
      {
        initialProps: {
          isFrameExpanded: false,
          phase: "closed" as const,
        } satisfies HookTestProps,
      },
    );

    act(() => {
      result.current.onMenuClick();
    });

    rerender({
      isFrameExpanded: true,
      phase: "open",
    } satisfies HookTestProps);

    act(() => {
      result.current.onFrameHoverEnd();
    });
    expect(close).toHaveBeenCalledTimes(0);

    act(() => {
      result.current.onMenuClick();
    });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("stays expanded when pinned even if focus and pointer conditions are lost", () => {
    const open = vi.fn();
    const close = vi.fn();

    const { result, rerender } = renderHook<
      ReturnType<typeof useNavbarInteractions>,
      HookTestProps
    >(
      ({ phase, isFrameExpanded }) =>
        useNavbarInteractions({
          close,
          isFrameExpanded,
          open,
          phase,
          realSuiteId: "general",
          setTheme: vi.fn(),
          theme: "light",
        }),
      {
        initialProps: {
          isFrameExpanded: false,
          phase: "closed" as const,
        } satisfies HookTestProps,
      },
    );

    act(() => {
      result.current.onMenuClick();
    });

    rerender({
      isFrameExpanded: true,
      phase: "open",
    } satisfies HookTestProps);

    act(() => {
      document.dispatchEvent(new Event("pointerleave"));
      window.dispatchEvent(new Event("blur"));
    });

    expect(close).toHaveBeenCalledTimes(0);
  });

  it("switches open suite and closes on row click", () => {
    const close = vi.fn();

    const { result } = renderHook(() =>
      useNavbarInteractions({
        close,
        isFrameExpanded: true,
        open: vi.fn(),
        phase: "open",
        realSuiteId: "general",
        setTheme: vi.fn(),
        theme: "light",
      }),
    );

    expect(result.current.openSuiteId).toBe("general");

    act(() => {
      result.current.onSuiteChange("registry");
    });
    expect(result.current.openSuiteId).toBe("registry");

    act(() => {
      result.current.onRowClick();
    });
    expect(close).toHaveBeenCalledTimes(1);
  });
});
