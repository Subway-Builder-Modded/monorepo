import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import type React from "react";
import type { PropsWithChildren } from "react";
import { installSharedJsdomMocks } from "../../testing/jsdom";

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

installSharedJsdomMocks({ createSpy: () => vi.fn(), includeIntersectionObserver: true });
