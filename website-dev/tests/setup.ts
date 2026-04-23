import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import type React from "react";
import type { PropsWithChildren } from "react";

type MotionDivProps = {
  children?: unknown;
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLDivElement>;

type AnimationPresenceProps = {
  children?: React.ReactNode;
};

vi.mock("motion/react", async () => {
  const React = await import("react");

  const MotionDiv = React.forwardRef<HTMLDivElement, PropsWithChildren<MotionDivProps>>(
    ({ children, ...props }, ref) => React.createElement("div", { ...props, ref }, children),
  );

  return {
    AnimatePresence: ({ children }: AnimationPresenceProps) =>
      React.createElement(React.Fragment, null, children),
    motion: new Proxy(
      {},
      {
        get() {
          return MotionDiv;
        },
      },
    ),
    useReducedMotion: () => false,
    useScroll: () => ({ scrollY: 0 }),
    useTransform: () => 0,
  };
});

afterEach(() => {
  cleanup();
});

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

if (!window.scrollTo) {
  Object.defineProperty(window, "scrollTo", {
    writable: true,
    value: vi.fn(),
  });
}

if (!("ResizeObserver" in window)) {
  class ResizeObserverMock implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: ResizeObserverMock,
  });
}

if (!("IntersectionObserver" in window)) {
  class IntersectionObserverMock implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly thresholds = [0];

    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  }

  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    value: IntersectionObserverMock,
  });
}
