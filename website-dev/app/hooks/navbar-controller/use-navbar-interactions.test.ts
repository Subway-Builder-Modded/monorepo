import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { useNavbarInteractions } from "@/app/hooks/navbar-controller/use-navbar-interactions";
import type { NavbarPhase } from "@/app/hooks/use-navbar-phase";

type HookTestProps = {
  allowHoverClose: boolean;
  isFrameExpanded: boolean;
  phase: NavbarPhase;
};

describe("useNavbarInteractions", () => {
  it("opens on hover and closes on hover end when not pinned", () => {
    const open = vi.fn();
    const close = vi.fn();

    const { result, rerender } = renderHook<
      ReturnType<typeof useNavbarInteractions>,
      HookTestProps
    >(
      ({ phase, isFrameExpanded, allowHoverClose }) =>
        useNavbarInteractions({
          allowHoverClose,
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
          allowHoverClose: false,
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
      allowHoverClose: true,
      isFrameExpanded: true,
      phase: "open",
    } satisfies HookTestProps);

    act(() => {
      result.current.onFrameHoverEnd();
    });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("keeps hover-close disabled while pinned and supports menu toggle close", () => {
    const open = vi.fn();
    const close = vi.fn();

    const { result, rerender } = renderHook<
      ReturnType<typeof useNavbarInteractions>,
      HookTestProps
    >(
      ({ phase, isFrameExpanded, allowHoverClose }) =>
        useNavbarInteractions({
          allowHoverClose,
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
          allowHoverClose: false,
          isFrameExpanded: false,
          phase: "closed" as const,
        } satisfies HookTestProps,
      },
    );

    act(() => {
      result.current.onMenuClick();
    });

    rerender({
      allowHoverClose: true,
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

  it("switches open suite and closes on row click", () => {
    const close = vi.fn();

    const { result } = renderHook(() =>
      useNavbarInteractions({
        allowHoverClose: true,
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
