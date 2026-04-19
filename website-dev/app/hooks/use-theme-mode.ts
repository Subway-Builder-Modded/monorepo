import { useCallback, useSyncExternalStore } from "react";

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

function resolveInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return getSystemPrefersDark() ? "dark" : "light";
}

let currentTheme: ThemeMode = "light";
if (typeof window !== "undefined") {
  currentTheme = resolveInitialTheme();
}

const listeners = new Set<() => void>();

function notifyThemeListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getThemeSnapshot(): ThemeMode {
  return currentTheme;
}

function getServerThemeSnapshot(): ThemeMode {
  return "light";
}

function commitTheme(nextTheme: ThemeMode, persist: boolean) {
  currentTheme = nextTheme;
  applyTheme(nextTheme);

  if (persist && typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }

  notifyThemeListeners();
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
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    if (typeof window === "undefined") {
      return;
    }

    commitTheme(nextTheme, true);
  }, []);

  return {
    theme,
    resolvedTheme: theme,
    setTheme,
  };
}

export function initializeThemeFromStorage() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const theme = resolveInitialTheme();
  commitTheme(theme, false);
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
