import { useEffect, useState, type RefObject } from "react";

type UseFloatingAnchorVisibilityProps = {
  enabled: boolean;
  tabsAnchorRef: RefObject<HTMLDivElement | null>;
  sidebarAnchorRef: RefObject<HTMLDivElement | null>;
};

function resolveNavbarRect() {
  const navbar = document.querySelector("nav.fixed.inset-x-0.top-4.z-50");
  if (navbar instanceof HTMLElement) {
    return navbar.getBoundingClientRect();
  }
  return null;
}

export function useFloatingAnchorVisibility({
  enabled,
  tabsAnchorRef,
  sidebarAnchorRef,
}: UseFloatingAnchorVisibilityProps) {
  const [showFloatingAnchor, setShowFloatingAnchor] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setShowFloatingAnchor(false);
      return;
    }

    const updateFloatingAnchorVisibility = () => {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

      if (isDesktop && sidebarAnchorRef.current) {
        const sidebarRect = sidebarAnchorRef.current.getBoundingClientRect();
        const sidebarStickyTop = 140;

        setShowFloatingAnchor((wasVisible) =>
          wasVisible
            ? sidebarRect.top <= sidebarStickyTop + 22
            : sidebarRect.top <= sidebarStickyTop + 1,
        );
        return;
      }

      if (!tabsAnchorRef.current) {
        setShowFloatingAnchor(false);
        return;
      }

      const tabsRect = tabsAnchorRef.current.getBoundingClientRect();
      const navbarRect = resolveNavbarRect();

      if (!navbarRect) {
        setShowFloatingAnchor(false);
        return;
      }

      setShowFloatingAnchor(tabsRect.bottom <= navbarRect.top + 2);
    };

    updateFloatingAnchorVisibility();
    window.addEventListener("scroll", updateFloatingAnchorVisibility, { passive: true });
    window.addEventListener("resize", updateFloatingAnchorVisibility);

    return () => {
      window.removeEventListener("scroll", updateFloatingAnchorVisibility);
      window.removeEventListener("resize", updateFloatingAnchorVisibility);
    };
  }, [enabled, sidebarAnchorRef, tabsAnchorRef]);

  return showFloatingAnchor;
}
