import { useCallback, useEffect, useRef, useState } from "react";

export type NavbarPhase =
  | "closed"
  | "openingFrame"
  | "openingPanel"
  | "open"
  | "closingRows"
  | "closingFrame";

/**
 * Stricter disclosure machine with explicit frame/panel/rows phases.
 *
 * Opening: closed -> openingFrame -> openingPanel -> open
 * Closing: open -> closingRows -> closingFrame -> closed
 *
 * Locking behavior:
 * - During openingFrame, hover-leave closes can be ignored by callers.
 * - During closingRows/closingFrame, reopen requests are ignored to prevent flicker.
 * - Escape/overlay/X close requests still transition cleanly through closing phases.
 */

const FRAME_EXPAND_MS = 320;
const PANEL_ENTER_MS = 130;
const ROW_EXIT_MS = 180;
const FRAME_COLLAPSE_MS = 260;

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
  const frameTimerRef = useRef<number | null>(null);
  const panelTimerRef = useRef<number | null>(null);
  const rowsTimerRef = useRef<number | null>(null);
  const closeFrameTimerRef = useRef<number | null>(null);
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
    if (frameTimerRef.current !== null) {
      window.clearTimeout(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    if (panelTimerRef.current !== null) {
      window.clearTimeout(panelTimerRef.current);
      panelTimerRef.current = null;
    }
    if (rowsTimerRef.current !== null) {
      window.clearTimeout(rowsTimerRef.current);
      rowsTimerRef.current = null;
    }
    if (closeFrameTimerRef.current !== null) {
      window.clearTimeout(closeFrameTimerRef.current);
      closeFrameTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  const open = useCallback(() => {
    const current = phaseRef.current;

    if (current === "open" || current === "openingFrame" || current === "openingPanel") {
      return;
    }

    if (current === "closingRows" || current === "closingFrame") {
      return;
    }

    clearTimers();
    setPhaseSync("openingFrame");
    frameTimerRef.current = window.setTimeout(() => {
      setPhaseSync("openingPanel");
      frameTimerRef.current = null;

      panelTimerRef.current = window.setTimeout(() => {
        setPhaseSync("open");
        panelTimerRef.current = null;
      }, duration(PANEL_ENTER_MS));
    }, duration(FRAME_EXPAND_MS));
  }, [clearTimers, duration, setPhaseSync]);

  const close = useCallback(() => {
    const current = phaseRef.current;

    if (current === "closed" || current === "closingRows" || current === "closingFrame") {
      return;
    }

    clearTimers();

    if (current === "openingFrame" || current === "openingPanel") {
      setPhaseSync("closingFrame");
      closeFrameTimerRef.current = window.setTimeout(() => {
        setPhaseSync("closed");
        closeFrameTimerRef.current = null;
        onFullyClosedRef.current?.();
      }, duration(FRAME_COLLAPSE_MS));
      return;
    }

    setPhaseSync("closingRows");
    rowsTimerRef.current = window.setTimeout(() => {
      setPhaseSync("closingFrame");
      rowsTimerRef.current = null;

      closeFrameTimerRef.current = window.setTimeout(() => {
        setPhaseSync("closed");
        closeFrameTimerRef.current = null;
        onFullyClosedRef.current?.();
      }, duration(FRAME_COLLAPSE_MS));
    }, duration(ROW_EXIT_MS));
  }, [clearTimers, duration, setPhaseSync]);

  return {
    phase,
    open,
    close,
    isFrameExpanded:
      phase === "openingFrame" ||
      phase === "openingPanel" ||
      phase === "open" ||
      phase === "closingRows",
    isPanelShellMounted: phase === "openingPanel" || phase === "open" || phase === "closingRows",
    areRowsVisible: phase === "open",
    isTransitionLocked:
      phase === "openingFrame" || phase === "closingRows" || phase === "closingFrame",
  };
}
