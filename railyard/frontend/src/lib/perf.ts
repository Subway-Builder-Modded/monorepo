// Lightweight performance-logging utility file that emits timing marks, measured durations, and
// main-thread long tasks to the console as well as the persisted backend log for diagnosing slow startups and other
// frontend performance issues.
import { LogFrontend } from '../../wailsjs/go/main/App';

const PREFIX = '[perf]';

function log(message: string) {
  const line = `${PREFIX} ${message}`;

  console.log(line);
  try {
    void LogFrontend('perf', line);
  } catch {
    // Not running inside Wails (e.g. unit tests); console output is enough.
  }
}

// mark logs a labelled point in time (ms since navigation), so gaps between marks are visible.
export function mark(name: string) {
  log(`${name} @ ${performance.now().toFixed(0)}ms`);
}

// markFirst stamps a point in time only the first time it is called with a given name.
const firstSeen = new Set<string>();
export function markFirst(name: string) {
  if (firstSeen.has(name)) return;
  firstSeen.add(name);
  mark(name);
}

// measureAsync times an async step and logs its duration (includes await time).
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    log(`${name}: ${(performance.now() - start).toFixed(1)}ms`);
  }
}

// measureSync times a synchronous step and logs its duration. Use for main-thread work
// (filtering, sorting), so the log attributes the freeze.
export function measureSync<T>(name: string, fn: () => T): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    log(`${name}: ${(performance.now() - start).toFixed(1)}ms`);
  }
}

// countRenders tallies how many times a component renders within a burst and logs the total.
// Re-render fan-out then shows up as a single number.
// This should be called from useEffect without dependencies so it counts committed renders and respects React.memo.
const renderTallies = new Map<
  string,
  { count: number; timer: ReturnType<typeof setTimeout> }
>();

function flushRenderTally(name: string) {
  const tally = renderTallies.get(name);
  if (!tally) return;
  renderTallies.delete(name);
  log(`${name} rendered ${tally.count}×`);
}

// Use 250ms to avoid logging a render burst that is still in progress (e.g. a parent re-rendering children one at a time).
export function countRenders(name: string) {
  const existing = renderTallies.get(name);
  if (existing) {
    existing.count += 1;
    clearTimeout(existing.timer);
    existing.timer = setTimeout(() => flushRenderTally(name), 250);
    return;
  }
  renderTallies.set(name, {
    count: 1,
    timer: setTimeout(() => flushRenderTally(name), 250),
  });
}

// addLongTaskObserver reports every main-thread task over ~50ms and its start time, so a
// UI freeze shows up as a log entry.
export function addLongTaskObserver() {
  if (typeof PerformanceObserver === 'undefined') return;
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        log(
          `LONG TASK ${entry.duration.toFixed(0)}ms starting @ ${entry.startTime.toFixed(0)}ms`,
        );
      }
    });
    observer.observe({ entryTypes: ['longtask'] });
  } catch {
    // longtask entry type not supported in this webview; marks still work.
  }
}
