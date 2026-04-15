import { useCallback, useEffect, useRef, useState } from "react";

export type NavbarPhase = "closed" | "opening" | "open" | "closing";

/**
 * Simplified disclosure machine for the unified navbar frame.
 *
 * Opening: closed -> opening -> open
 * Closing: open -> closing -> closed
 *
 * Timers are centralized in this hook and fully cleared on unmount.
 * Reopen requests during closing are ignored for stability.
 */

const FRAME_EXPAND_MS = 320;
const PANEL_SURFACE_ENTER_MS = 210;
const ROW_EXIT_MS = 170;
const PANEL_SURFACE_EXIT_MS = 110;
const FRAME_COLLAPSE_MS = 250;

type UseNavbarPhaseOptions = {
  onFullyClosed?: () => void;
  reducedMotion?: boolean;
};

export function useNavbarPhase({
  onFullyClosed,
  reducedMotion = false,
}: UseNavbarPhaseOptions = {}) {
  const [phase, setPhase] = useState<NavbarPhase>("closed");
  const [showPanelSurface, setShowPanelSurface] = useState(false);
  const [showRows, setShowRows] = useState(false);

  const phaseRef = useRef<NavbarPhase>("closed");
  const openSurfaceTimerRef = useRef<number | null>(null);
  const openDoneTimerRef = useRef<number | null>(null);
  const closeSurfaceTimerRef = useRef<number | null>(null);
  const closeDoneTimerRef = useRef<number | null>(null);

  const onFullyClosedRef = useRef(onFullyClosed);
  onFullyClosedRef.current = onFullyClosed;

  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const setPhaseSync = useCallback((next: NavbarPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const duration = useCallback((ms: number) => {
    return reducedMotionRef.current ? 0 : ms;
  }, []);

  const clearTimers = useCallback(() => {
    if (openSurfaceTimerRef.current !== null) {
      window.clearTimeout(openSurfaceTimerRef.current);
      openSurfaceTimerRef.current = null;
    }

    if (openDoneTimerRef.current !== null) {
      window.clearTimeout(openDoneTimerRef.current);
      openDoneTimerRef.current = null;
    }

    if (closeSurfaceTimerRef.current !== null) {
      window.clearTimeout(closeSurfaceTimerRef.current);
      closeSurfaceTimerRef.current = null;
    }

    if (closeDoneTimerRef.current !== null) {
      window.clearTimeout(closeDoneTimerRef.current);
      closeDoneTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  const open = useCallback(() => {
    const current = phaseRef.current;

    if (current === "open" || current === "opening") {
      return;
    }

    if (current === "closing") {
      return;
    }

    clearTimers();
    setShowPanelSurface(false);
    setShowRows(false);
    setPhaseSync("opening");

    openSurfaceTimerRef.current = window.setTimeout(() => {
      setShowPanelSurface(true);
      openSurfaceTimerRef.current = null;
    }, duration(PANEL_SURFACE_ENTER_MS));

    openDoneTimerRef.current = window.setTimeout(() => {
      setShowRows(true);
      setPhaseSync("open");
      openDoneTimerRef.current = null;
    }, duration(FRAME_EXPAND_MS));
  }, [clearTimers, duration, setPhaseSync]);

  const close = useCallback(() => {
    const current = phaseRef.current;

    if (current === "closed" || current === "closing") {
      return;
    }

    clearTimers();
    setPhaseSync("closing");
    setShowRows(false);

    closeSurfaceTimerRef.current = window.setTimeout(() => {
      setShowPanelSurface(false);
      closeSurfaceTimerRef.current = null;
    }, duration(ROW_EXIT_MS));

    closeDoneTimerRef.current = window.setTimeout(
      () => {
        setShowRows(false);
        setShowPanelSurface(false);
        setPhaseSync("closed");
        closeDoneTimerRef.current = null;
        onFullyClosedRef.current?.();
      },
      duration(ROW_EXIT_MS + PANEL_SURFACE_EXIT_MS + FRAME_COLLAPSE_MS),
    );
  }, [clearTimers, duration, setPhaseSync]);

  useEffect(() => {
    if (phase === "closed") {
      setShowPanelSurface(false);
      setShowRows(false);
    }
  }, [phase]);

  return {
    phase,
    open,
    close,
    isFrameExpanded: phase !== "closed",
    showPanelSurface,
    showRows,
    allowHoverClose: phase === "open",
    isTransitionLocked: phase === "opening" || phase === "closing",
  };
}
