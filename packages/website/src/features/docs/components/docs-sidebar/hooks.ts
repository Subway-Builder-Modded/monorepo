import * as React from 'react';
import {
  EDGE_GAP_PX,
  MOBILE_BREAKPOINT,
} from '@/features/docs/components/docs-sidebar/helpers';

export function useDocsIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

export function useOnClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void,
) {
  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!ref.current || ref.current.contains(target)) return;
      handler();
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [ref, handler]);
}

export function useSidebarFloatingLayout({
  open,
  containerRef,
  panelRef,
}: {
  open: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  panelRef: React.RefObject<HTMLElement | null>;
}) {
  const [sidebarTop, setSidebarTop] = React.useState(88);
  const [sidebarLeft, setSidebarLeft] = React.useState(0);
  const [sidebarMaxHeight, setSidebarMaxHeight] = React.useState(500);

  const updateLayout = React.useCallback(() => {
    const navbarOffset =
      Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--app-navbar-offset',
        ),
      ) || 88;
    const idealTop = navbarOffset;

    const containerLeft = containerRef?.current
      ? containerRef.current.getBoundingClientRect().left
      : 0;
    setSidebarLeft(containerLeft + EDGE_GAP_PX);

    if (!open) {
      setSidebarTop(idealTop);
      setSidebarMaxHeight(window.innerHeight - idealTop - EDGE_GAP_PX);
      return;
    }

    const footer = document.getElementById('site-footer');
    const panelEl = panelRef.current;
    const panelHeight = panelEl?.getBoundingClientRect().height ?? 0;

    if (footer) {
      const footerTop = footer.getBoundingClientRect().top;
      const nextTop = Math.min(idealTop, footerTop - panelHeight - EDGE_GAP_PX);
      setSidebarTop(nextTop);
      setSidebarMaxHeight(window.innerHeight - nextTop - EDGE_GAP_PX);
      return;
    }

    setSidebarTop(idealTop);
    setSidebarMaxHeight(window.innerHeight - idealTop - EDGE_GAP_PX);
  }, [containerRef, open, panelRef]);

  React.useLayoutEffect(() => {
    updateLayout();
  }, [updateLayout]);

  React.useEffect(() => {
    if (open) {
      window.addEventListener('scroll', updateLayout, { passive: true });
    }
    window.addEventListener('resize', updateLayout, { passive: true });

    const resizeObserver = new ResizeObserver(updateLayout);
    if (containerRef?.current) resizeObserver.observe(containerRef.current);
    if (panelRef.current) resizeObserver.observe(panelRef.current);

    return () => {
      window.removeEventListener('scroll', updateLayout);
      window.removeEventListener('resize', updateLayout);
      resizeObserver.disconnect();
    };
  }, [containerRef, open, panelRef, updateLayout]);

  return {
    sidebarTop,
    sidebarLeft,
    sidebarMaxHeight,
    refreshLayout: updateLayout,
  };
}

export function useSidebarScrollThumb({
  open,
  scrollRef,
}: {
  open: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [showScrollThumb, setShowScrollThumb] = React.useState(false);
  const [thumbHeight, setThumbHeight] = React.useState(0);
  const [thumbTop, setThumbTop] = React.useState(0);

  React.useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || !open) {
      setShowScrollThumb(false);
      return;
    }

    const updateThumb = () => {
      const { clientHeight, scrollHeight, scrollTop } = scrollEl;
      const overflow = scrollHeight - clientHeight;
      if (overflow <= 1) {
        setShowScrollThumb(false);
        setThumbHeight(0);
        setThumbTop(0);
        return;
      }

      const nextHeight = Math.max(
        24,
        (clientHeight * clientHeight) / scrollHeight,
      );
      const maxTop = clientHeight - nextHeight;
      setShowScrollThumb(true);
      setThumbHeight(nextHeight);
      setThumbTop((scrollTop / overflow) * maxTop);
    };

    updateThumb();
    scrollEl.addEventListener('scroll', updateThumb, { passive: true });
    window.addEventListener('resize', updateThumb);

    const resizeObserver = new ResizeObserver(updateThumb);
    resizeObserver.observe(scrollEl);
    const contentEl = scrollEl.firstElementChild as HTMLElement | null;
    if (contentEl) resizeObserver.observe(contentEl);

    return () => {
      scrollEl.removeEventListener('scroll', updateThumb);
      window.removeEventListener('resize', updateThumb);
      resizeObserver.disconnect();
    };
  }, [open, scrollRef]);

  return {
    showScrollThumb,
    thumbHeight,
    thumbTop,
  };
}
