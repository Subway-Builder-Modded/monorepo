import { useCallback, useEffect, useRef, useState } from "react";

export type NavbarPhase = "closed" | "opening" | "open" | "closing";

export const NAVBAR_MOTION = {
  frameExpandMs: 300,
  frameCollapseMs: 200,
  panelSurfaceEnterMs: 170,
  rowExitMs: 110,
  panelSurfaceExitMs: 110,
  closeSettleMs: 260,
} as const;

/**
 * Simplified disclosure machine for the unified navbar frame.
 *
 * Opening: closed -> opening -> open
 * Closing: open -> closing -> closed
 *
 * Timers are centralized in this hook and fully cleared on unmount.
 * Reopen requests during closing are ignored for stability.
 */

type UseNavbarPhaseOptions = {
  canStartEnterMotion?: boolean;
  onFullyClosed?: () => void;
  reducedMotion?: boolean;
};

export function useNavbarPhase({
  canStartEnterMotion = true,
  onFullyClosed,
  reducedMotion = false,
}: UseNavbarPhaseOptions = {}) {
  const [phase, setPhase] = useState<NavbarPhase>("closed");
  const [isFrameExpanded, setIsFrameExpanded] = useState(false);
  const [showPanelSurface, setShowPanelSurface] = useState(false);
  const [showRows, setShowRows] = useState(false);

  const phaseRef = useRef<NavbarPhase>("closed");
  const enterSequenceStartedRef = useRef(false);
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
    enterSequenceStartedRef.current = false;
    setIsFrameExpanded(false);
    setShowPanelSurface(false);
    setShowRows(false);
    setPhaseSync("opening");
  }, [clearTimers, duration, setPhaseSync]);

  useEffect(() => {
    if (phase !== "opening" || !canStartEnterMotion || enterSequenceStartedRef.current) {
      return;
    }

    enterSequenceStartedRef.current = true;
    setIsFrameExpanded(true);

    openSurfaceTimerRef.current = window.setTimeout(() => {
      setShowPanelSurface(true);
      openSurfaceTimerRef.current = null;
    }, duration(NAVBAR_MOTION.panelSurfaceEnterMs));

    openDoneTimerRef.current = window.setTimeout(() => {
      setShowRows(true);
      setPhaseSync("open");
      openDoneTimerRef.current = null;
    }, duration(NAVBAR_MOTION.frameExpandMs));
  }, [canStartEnterMotion, duration, phase, setPhaseSync]);

  const close = useCallback(() => {
    const current = phaseRef.current;

    if (current === "closed" || current === "closing") {
      return;
    }

    clearTimers();
    enterSequenceStartedRef.current = false;
    setPhaseSync("closing");
    setIsFrameExpanded(false);
    setShowRows(false);

    closeSurfaceTimerRef.current = window.setTimeout(() => {
      setShowPanelSurface(false);
      closeSurfaceTimerRef.current = null;
    }, duration(NAVBAR_MOTION.rowExitMs));

    closeDoneTimerRef.current = window.setTimeout(() => {
      setShowRows(false);
      setShowPanelSurface(false);
      setPhaseSync("closed");
      closeDoneTimerRef.current = null;
      onFullyClosedRef.current?.();
    }, duration(NAVBAR_MOTION.closeSettleMs));
  }, [clearTimers, duration, setPhaseSync]);

  useEffect(() => {
    if (phase === "closed") {
      enterSequenceStartedRef.current = false;
      setIsFrameExpanded(false);
      setShowPanelSurface(false);
      setShowRows(false);
    }
  }, [phase]);

  return {
    phase,
    open,
    close,
    isFrameExpanded,
    showPanelSurface,
    showRows,
    allowHoverClose: phase === "open",
    isTransitionLocked: phase === "opening" || phase === "closing",
  };
}
