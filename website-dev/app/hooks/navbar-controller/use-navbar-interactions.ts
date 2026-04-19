import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteSuiteId } from "@/app/config/site-navigation";
import type { NavbarPhase } from "@/app/hooks/use-navbar-phase";
import type { ThemeMode } from "@/app/hooks/use-theme-mode";

type UseNavbarInteractionsOptions = {
  allowHoverClose: boolean;
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
  allowHoverClose,
  close,
  isFrameExpanded,
  open,
  phase,
  realSuiteId,
  setTheme,
  theme,
}: UseNavbarInteractionsOptions) {
  const [openSuiteId, setOpenSuiteId] = useState<SiteSuiteId>(realSuiteId);
  const isPinnedRef = useRef(false);

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
    if (phase === "closed") {
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
    if (phase === "closed") {
      openNavbar();
    }
  }, [openNavbar, phase]);

  const onFrameHoverEnd = useCallback(() => {
    if (allowHoverClose && !isPinnedRef.current) {
      close();
    }
  }, [allowHoverClose, close]);

  const onFrameClick = useCallback(() => {
    if (isFrameExpanded && !isPinnedRef.current) {
      isPinnedRef.current = true;
    }
  }, [isFrameExpanded]);

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
