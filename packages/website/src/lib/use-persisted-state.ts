'use client';

import { useCallback, useEffect, useState } from 'react';

type Updater<T> = T | ((prev: T) => T);

export function usePersistedState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(key);
      if (stored == null) {
        setValue(initialValue);
        return;
      }
      setValue(JSON.parse(stored) as T);
    } catch {
      setValue(initialValue);
    }
    // `initialValue` is intentionally omitted so object literals passed by callers
    // don't retrigger hydration reads and cause render loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const updateValue = useCallback(
    (next: Updater<T>) => {
      setValue((prev) => {
        const resolved =
          typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(resolved));
          }
        } catch {
          // no-op
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, updateValue] as const;
}
