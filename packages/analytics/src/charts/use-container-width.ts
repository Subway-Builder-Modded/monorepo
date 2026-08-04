import { useEffect, useRef, useState } from "react";

/**
 * Observed content width of a chart wrapper, for fitting axis ticks to the
 * viewport. Stays 0 until measured — and remains 0 where ResizeObserver does
 * not exist (jsdom/SSR), which callers treat as "don't width-thin".
 */
export function useContainerWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      setWidth(Math.round(entries[0]?.contentRect.width ?? 0));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}
