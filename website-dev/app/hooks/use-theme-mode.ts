import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "sbm-website-dev-theme";

export type ThemeMode = "light" | "dark" | "system";

type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

function subscribeMediaQuery(
  media: MediaQueryList,
  listener: (event: MediaQueryListEvent) => void,
) {
  const legacyMedia = media as LegacyMediaQueryList;

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }

  if (typeof legacyMedia.addListener === "function") {
    legacyMedia.addListener(listener);
    return () => {
      legacyMedia.removeListener?.(listener);
    };
  }

  return () => {};
}

function getSystemPrefersDark() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveIsDark(theme: ThemeMode): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return getSystemPrefersDark();
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const isDark = resolveIsDark(theme);
  root.classList.toggle("dark", isDark);
  root.dataset.theme = theme;
}

export function useThemeMode() {
  const [theme, setThemeState] = useState<ThemeMode>("system");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemeState(stored);
      applyTheme(stored);
      return;
    }

    applyTheme("system");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    applyTheme(theme);

    if (theme !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("system");
    return subscribeMediaQuery(media, listener);
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    if (typeof window === "undefined") {
      setThemeState(nextTheme);
      return;
    }

    setThemeState(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }, []);

  const resolvedTheme = useMemo<"light" | "dark">(() => {
    return resolveIsDark(theme) ? "dark" : "light";
  }, [theme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
  };
}

export function initializeThemeFromStorage() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  const theme: ThemeMode =
    stored === "light" || stored === "dark" || stored === "system" ? stored : "system";

  applyTheme(theme);
}

export function getThemeBootScript() {
  return `
(function () {
  var storageKey = "${STORAGE_KEY}";
  var stored = window.localStorage.getItem(storageKey);
  var theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  var isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.dataset.theme = theme;
})();
`;
}
