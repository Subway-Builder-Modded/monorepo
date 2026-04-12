import { useEffect, useRef } from 'react';

export interface UsePageWarmupOptions {
  /**
   * Optional: If false, warmup does not run for the current render cycle.
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback invoked when warmup completes successfully.
   */
  onReady: () => void;

  /**
   * Array of async tasks to execute in parallel during warmup.
   * Each task should be a function that returns a Promise.
   * Results are settled; individual failures do not block completion.
   */
  warmupTasks: Array<() => Promise<void>>;

  /**
   * Optional: If true, skip the requestAnimationFrame timing delay.
   * Useful for testing or when layout stabilization is not needed.
   * @default false
   */
  skipRafDelay?: boolean;
}

/**
 * Orchestrates page-level warmup: executing tasks (e.g., image preloading),
 * waiting for layout stabilization via requestAnimationFrame, and signaling
 * readiness. Commonly used to prepare heavy content before unhiding a page
 * or region.
 *
 * @param options Configuration for warmup behavior
 *
 * @example
 * usePageWarmup({
 *   onReady: () => setPageVisible(true),
 *   warmupTasks: [
 *     () => preloadImage('url1'),
 *     () => preloadImage('url2'),
 *   ],
 * });
 */
export function usePageWarmup({
  enabled = true,
  onReady,
  warmupTasks,
  skipRafDelay = false,
}: UsePageWarmupOptions): void {
  const warmupCompleteRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const executeWarmup = async () => {
      // Execute all warmup tasks in parallel, but don't fail if any individual task fails
      await Promise.allSettled(warmupTasks.map((task) => task()));

      // Skip RAF delay if explicitly requested (e.g., during testing)
      if (!skipRafDelay) {
        // Wait for 2 animation frame cycles to allow layout settling
        await new Promise<void>((resolve) => {
          let firstFrame = 0;
          let secondFrame = 0;

          firstFrame = requestAnimationFrame(() => {
            secondFrame = requestAnimationFrame(() => {
              resolve();
            });
          });

          // Cleanup animation frames if the hook is cancelled before they fire
          if (cancelled) {
            cancelAnimationFrame(firstFrame);
            cancelAnimationFrame(secondFrame);
            resolve();
          }
        });
      }

      // Call onReady unless cleanup was triggered
      if (!cancelled && !warmupCompleteRef.current) {
        warmupCompleteRef.current = true;
        onReady();
      }
    };

    // Reset state when tasks or onReady change (e.g., new page load)
    warmupCompleteRef.current = false;

    executeWarmup().catch(() => {
      // If warmup throws (e.g., cancelled), still call onReady to unblock UI
      if (!cancelled && !warmupCompleteRef.current) {
        warmupCompleteRef.current = true;
        onReady();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, warmupTasks, onReady, skipRafDelay]);
}
