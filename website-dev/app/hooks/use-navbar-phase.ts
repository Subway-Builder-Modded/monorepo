import { useCallback, useEffect, useRef, useState } from "react";

export type NavbarPhase = "closed" | "opening" | "open" | "closing";

/**
 * Phase-based disclosure machine for the floating navbar.
 *
 * Phase semantics:
 * - `closed`   : pill state. Bar is narrow. No panel.
 * - `opening`  : bar is expanding (CSS transition). Panel is not yet mounted.
 * - `open`     : bar fully expanded. Panel and rows are visible.
 * - `closing`  : rows and panel animating out. Bar stays wide until fully closed.
 *
 * Derived visual flags:
 * - `isBarWide`       : true during opening/open/closing (keeps bar wide during row exit)
 * - `isPanelMounted`  : true only during open/closing (panel not present while bar expands)
 * - `areRowsVisible`  : true only when open (controls Motion animate target for rows)
 *
 * Interruption handling:
 * - close during opening  → snap to closed immediately (no panel was visible)
 * - open during closing   → cancel collapse timer, snap back to open (rows re-enter smoothly)
 */

const BAR_EXPAND_MS = 300;
const ROW_EXIT_MS = 220;

type UseNavbarPhaseOptions = {
  onFullyClosed?: () => void;
  reducedMotion?: boolean;
};

export function useNavbarPhase({
  onFullyClosed,
  reducedMotion = false,
}: UseNavbarPhaseOptions = {}) {
  const [phase, setPhase] = useState<NavbarPhase>("closed");

  const phaseRef = useRef<NavbarPhase>("closed");
  const expandTimerRef = useRef<number | null>(null);
  const collapseTimerRef = useRef<number | null>(null);
  const onFullyClosedRef = useRef(onFullyClosed);
  onFullyClosedRef.current = onFullyClosed;

  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const setPhaseSync = useCallback((next: NavbarPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const clearTimers = useCallback(() => {
    if (expandTimerRef.current !== null) {
      window.clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }
    if (collapseTimerRef.current !== null) {
      window.clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  const open = useCallback(() => {
    const current = phaseRef.current;

    if (current === "open" || current === "opening") return;

    if (current === "closing") {
      // Interrupt closing — rows are still mounted, snap back to open
      if (collapseTimerRef.current !== null) {
        window.clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
      setPhaseSync("open");
      return;
    }

    // closed → opening
    if (expandTimerRef.current !== null) {
      window.clearTimeout(expandTimerRef.current);
    }
    setPhaseSync("opening");
    expandTimerRef.current = window.setTimeout(
      () => {
        setPhaseSync("open");
        expandTimerRef.current = null;
      },
      reducedMotionRef.current ? 0 : BAR_EXPAND_MS,
    );
  }, [setPhaseSync]);

  const close = useCallback(() => {
    const current = phaseRef.current;

    if (current === "closed" || current === "closing") return;

    if (current === "opening") {
      // Interrupt opening — bar was expanding, no panel mounted yet
      if (expandTimerRef.current !== null) {
        window.clearTimeout(expandTimerRef.current);
        expandTimerRef.current = null;
      }
      setPhaseSync("closed");
      return;
    }

    // open → closing
    if (collapseTimerRef.current !== null) {
      window.clearTimeout(collapseTimerRef.current);
    }
    setPhaseSync("closing");
    collapseTimerRef.current = window.setTimeout(
      () => {
        setPhaseSync("closed");
        collapseTimerRef.current = null;
        onFullyClosedRef.current?.();
      },
      reducedMotionRef.current ? 0 : ROW_EXIT_MS,
    );
  }, [setPhaseSync]);

  return {
    phase,
    open,
    close,
    isBarWide: phase !== "closed",
    isPanelMounted: phase === "open" || phase === "closing",
    areRowsVisible: phase === "open",
  };
}
