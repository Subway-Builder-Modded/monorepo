import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Link, navigate, shouldHandleClientNavigation, useLocation } from "@/lib/router";

// Clear all spy call counts before every test so accumulated calls don't bleed across tests.
// vi.clearAllMocks is used (not restoreAllMocks) to preserve vi.fn() assignments from setup.ts.
beforeEach(() => {
  vi.clearAllMocks();
});

describe("navigate", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("pushes new path to history", () => {
    navigate("/about");
    expect(window.location.pathname).toBe("/about");
  });

  it("scrolls to top after navigating", () => {
    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    navigate("/contact");
    expect(scrollSpy).toHaveBeenCalledWith(0, 0);
  });

  it("does not push a new history entry when pathname is unchanged", () => {
    navigate("/about");
    const historyLength = window.history.length;
    navigate("/about"); // same path — no-op
    expect(window.history.length).toBe(historyLength);
  });

  it("prepends slash when path does not start with one", () => {
    navigate("docs");
    expect(window.location.pathname).toBe("/docs");
  });
});

describe("useLocation", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("returns the current pathname on mount", () => {
    const { result } = renderHook(() => useLocation());
    expect(result.current.pathname).toBe("/");
  });

  it("updates pathname when navigate is called", () => {
    const { result } = renderHook(() => useLocation());
    act(() => {
      navigate("/docs");
    });
    expect(result.current.pathname).toBe("/docs");
  });

  it("updates pathname on popstate event", () => {
    const { result } = renderHook(() => useLocation());
    act(() => {
      window.history.pushState({}, "", "/settings");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.pathname).toBe("/settings");
  });

  it("reflects search and hash from the current location", () => {
    const { result } = renderHook(() => useLocation());
    act(() => {
      window.history.pushState({}, "", "/search?q=foo#section");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.pathname).toBe("/search");
    expect(result.current.search).toBe("?q=foo");
    expect(result.current.hash).toBe("#section");
  });
});

describe("Link", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders an anchor with the correct href for SPA routes", () => {
    render(<Link to="/about">About</Link>);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/about");
  });

  it("renders external https links with the original href", () => {
    render(<Link to="https://example.com">External</Link>);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.com");
  });

  it("renders mailto links with the original href", () => {
    render(<Link to="mailto:hello@example.com">Email</Link>);
    expect(screen.getByRole("link")).toHaveAttribute("href", "mailto:hello@example.com");
  });

  it("renders tel links with the original href", () => {
    render(<Link to="tel:+1234567890">Phone</Link>);
    expect(screen.getByRole("link")).toHaveAttribute("href", "tel:+1234567890");
  });

  it("calls navigate on SPA link click", () => {
    render(<Link to="/about">About</Link>);
    fireEvent.click(screen.getByRole("link"));
    expect(window.location.pathname).toBe("/about");
  });

  it("calls the custom onClick handler", () => {
    const onClick = vi.fn();
    render(
      <Link to="/about" onClick={onClick}>
        About
      </Link>,
    );
    fireEvent.click(screen.getByRole("link"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not navigate when onClick calls preventDefault", () => {
    render(
      <Link to="/about" onClick={(e) => e.preventDefault()}>
        About
      </Link>,
    );
    fireEvent.click(screen.getByRole("link"));
    expect(window.location.pathname).toBe("/");
  });
});

describe("shouldHandleClientNavigation", () => {
  it("returns false for external https links", () => {
    expect(
      shouldHandleClientNavigation({
        defaultPrevented: false,
        to: "https://example.com",
      }),
    ).toBe(false);
  });

  it("returns false for mailto links", () => {
    expect(
      shouldHandleClientNavigation({
        defaultPrevented: false,
        to: "mailto:hello@example.com",
      }),
    ).toBe(false);
  });

  it("returns false for modified clicks", () => {
    expect(
      shouldHandleClientNavigation({
        defaultPrevented: false,
        to: "/about",
        metaKey: true,
      }),
    ).toBe(false);

    expect(
      shouldHandleClientNavigation({
        defaultPrevented: false,
        to: "/about",
        ctrlKey: true,
      }),
    ).toBe(false);
  });

  it("returns false when target is not _self", () => {
    expect(
      shouldHandleClientNavigation({
        defaultPrevented: false,
        to: "/about",
        target: "_blank",
      }),
    ).toBe(false);
  });

  it("returns false when earlier handlers prevented default", () => {
    expect(
      shouldHandleClientNavigation({
        defaultPrevented: true,
        to: "/about",
      }),
    ).toBe(false);
  });

  it("returns true for SPA self-navigation", () => {
    expect(
      shouldHandleClientNavigation({
        defaultPrevented: false,
        to: "/about",
      }),
    ).toBe(true);
  });
});
