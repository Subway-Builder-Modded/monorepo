import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteSuiteId } from "@/app/config/site-navigation";
import type { NavbarPhase } from "@/app/hooks/use-navbar-phase";
import type { ThemeMode } from "@/app/hooks/use-theme-mode";

type UseNavbarInteractionsOptions = {
  close: () => void;
  isFrameExpanded: boolean;
  open: () => void;
  phase: NavbarPhase;
  realSuiteId: SiteSuiteId;
  setTheme: (theme: ThemeMode) => void;
  theme: ThemeMode;
};

function getNextTheme(theme: ThemeMode): ThemeMode {
  return theme === "light" ? "dark" : "light";
}

export function useNavbarInteractions({
  close,
  isFrameExpanded,
  open,
  phase,
  realSuiteId,
  setTheme,
  theme,
}: UseNavbarInteractionsOptions) {
  const [openSuiteId, setOpenSuiteId] = useState<SiteSuiteId>(realSuiteId);
  const [windowFocused, setWindowFocused] = useState(() => document.hasFocus());
  const [pointerOnScreen, setPointerOnScreen] = useState(true);
  const isPinnedRef = useRef(false);

  const canAutoExpand = windowFocused || pointerOnScreen;

  useEffect(() => {
    const onFocus = () => setWindowFocused(true);
    const onBlur = () => setWindowFocused(false);
    const onPointerEnter = () => setPointerOnScreen(true);
    const onPointerLeave = () => setPointerOnScreen(false);

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    document.addEventListener("pointerenter", onPointerEnter);
    document.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("pointerenter", onPointerEnter);
      document.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  useEffect(() => {
    if (phase === "closed") {
      setOpenSuiteId(realSuiteId);
    }
  }, [phase, realSuiteId]);

  const closeNavbar = useCallback(() => {
    isPinnedRef.current = false;
    close();
  }, [close]);

  const openNavbar = useCallback(() => {
    if (phase !== "open") {
      setOpenSuiteId(realSuiteId);
      open();
    }
  }, [open, phase, realSuiteId]);

  const onMenuClick = useCallback(() => {
    if (isFrameExpanded) {
      closeNavbar();
      return;
    }

    isPinnedRef.current = true;
    openNavbar();
  }, [closeNavbar, isFrameExpanded, openNavbar]);

  const onFrameHoverStart = useCallback(() => {
    if (phase !== "open" && canAutoExpand) {
      openNavbar();
    }
  }, [canAutoExpand, openNavbar, phase]);

  const onFrameHoverEnd = useCallback(() => {
    if (!isPinnedRef.current) {
      close();
    }
  }, [close]);

  const onFrameClick = useCallback(() => {
    if (isFrameExpanded && !isPinnedRef.current) {
      isPinnedRef.current = true;
    }
  }, [isFrameExpanded]);

  useEffect(() => {
    if (!canAutoExpand && isFrameExpanded && !isPinnedRef.current) {
      close();
    }
  }, [canAutoExpand, close, isFrameExpanded]);

  const onSuiteChange = useCallback((suiteId: SiteSuiteId) => {
    setOpenSuiteId(suiteId);
  }, []);

  const onThemeClick = useCallback(() => {
    setTheme(getNextTheme(theme));
  }, [setTheme, theme]);

  const onRowClick = useCallback(() => {
    closeNavbar();
  }, [closeNavbar]);

  return {
    closeNavbar,
    onFrameClick,
    onFrameHoverEnd,
    onFrameHoverStart,
    onMenuClick,
    onRowClick,
    onSuiteChange,
    onThemeClick,
    openNavbar,
    openSuiteId,
  };
}
