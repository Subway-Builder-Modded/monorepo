import { useState, useCallback } from "react";

export function useSidebarCollapsed(storageKey: string) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  });

  const setCollapsedState = useCallback(
    (next: boolean) => {
      setCollapsed(next);
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // ignore persisted state failures
      }
    },
    [storageKey],
  );

  return { collapsed, setCollapsedState };
}
