import { useEffect, useState } from "react";
import type { MarkdownPlaygroundMode } from "./types";

export const STORAGE_KEYS = {
  content: "sbm.registry.markdownPlayground.content",
  mode: "sbm.registry.markdownPlayground.mode",
} as const;

export const DEFAULT_MARKDOWN = "# Registry Markdown Playground\n\nStart writing your draft here.";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseStoredMode(value: string | null): MarkdownPlaygroundMode {
  return value === "rich" ? "rich" : "markdown";
}

export function usePlaygroundStorage() {
  const [mode, setMode] = useState<MarkdownPlaygroundMode>("markdown");
  const [content, setContent] = useState<string>(DEFAULT_MARKDOWN);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!canUseStorage()) {
      setHydrated(true);
      return;
    }

    try {
      const savedContent = window.localStorage.getItem(STORAGE_KEYS.content);
      const savedMode = window.localStorage.getItem(STORAGE_KEYS.mode);
      if (savedContent != null) {
        setContent(savedContent);
      }
      setMode(parseStoredMode(savedMode));
    } catch {
      // Ignore storage failures; page still works with in-memory state.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !canUseStorage()) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEYS.content, content);
    } catch {
      // Ignore write failures (private mode, quota exceeded, etc).
    }
  }, [content, hydrated]);

  useEffect(() => {
    if (!hydrated || !canUseStorage()) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEYS.mode, mode);
    } catch {
      // Ignore write failures (private mode, quota exceeded, etc).
    }
  }, [mode, hydrated]);

  return {
    mode,
    setMode,
    content,
    setContent,
    hydrated,
  };
}
