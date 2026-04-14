import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "sbm-site-theme";

export type ThemeMode = "light" | "dark";

function getSystemPrefersDark() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveIsDark(theme: ThemeMode): boolean {
  return theme === "dark";
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
  const [theme, setThemeState] = useState<ThemeMode>(getSystemPrefersDark() ? "dark" : "light");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
      applyTheme(stored);
      return;
    }

    const fallbackTheme: ThemeMode = getSystemPrefersDark() ? "dark" : "light";
    setThemeState(fallbackTheme);
    applyTheme(fallbackTheme);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    applyTheme(theme);
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

  const resolvedTheme = useMemo<"light" | "dark">(() => theme, [theme]);

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
    stored === "light" || stored === "dark" ? stored : getSystemPrefersDark() ? "dark" : "light";

  applyTheme(theme);
}

export function getThemeBootScript() {
  return `
(function () {
  var storageKey = "${STORAGE_KEY}";
  var stored = window.localStorage.getItem(storageKey);
  var theme = stored === "light" || stored === "dark"
    ? stored
    : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  var isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.dataset.theme = theme;
})();
`;
}
