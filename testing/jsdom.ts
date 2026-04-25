type SharedJsdomOptions = {
  includeIntersectionObserver?: boolean;
  createSpy: () => unknown;
};

export function installSharedJsdomMocks(options: SharedJsdomOptions) {
  const { createSpy, includeIntersectionObserver = false } = options;

  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: createSpy(),
        removeEventListener: createSpy(),
        addListener: createSpy(),
        removeListener: createSpy(),
        dispatchEvent: createSpy(),
      }),
    });
  }

  Object.defineProperty(window, "scrollTo", {
    writable: true,
    value: createSpy(),
  });

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

  if (includeIntersectionObserver && !("IntersectionObserver" in window)) {
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
}