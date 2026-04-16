import { useCallback, useEffect, useRef } from "react";

type UseDelayedCloseOptions = {
  delayMs?: number;
  onClose: () => void;
  disabled?: boolean;
};

/**
 * Manages a delayed close timer for hover-triggered disclosure.
 * Cancelling re-entry prevents the close from firing.
 *
 * - `schedule()` : start the close timer (no-op if disabled)
 * - `cancel()`   : cancel any pending close timer
 */
export function useDelayedClose({
  delayMs = 150,
  onClose,
  disabled = false,
}: UseDelayedCloseOptions) {
  const timerRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const schedule = useCallback(() => {
    if (disabled) return;
    cancel();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      onCloseRef.current();
    }, delayMs);
  }, [cancel, delayMs, disabled]);

  useEffect(() => {
    return cancel;
  }, [cancel]);

  return { schedule, cancel };
}
