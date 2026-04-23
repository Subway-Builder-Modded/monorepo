import { useEffect, useState } from "react";

type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    const legacyMedia = media as LegacyMediaQueryList;

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", listener);
      return () => {
        media.removeEventListener("change", listener);
      };
    }

    if (typeof legacyMedia.addListener === "function") {
      legacyMedia.addListener(listener);
      return () => {
        legacyMedia.removeListener?.(listener);
      };
    }

    return () => {};
  }, [query]);

  return matches;
}
