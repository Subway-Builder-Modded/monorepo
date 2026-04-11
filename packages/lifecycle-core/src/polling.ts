export interface PollUntilReadyOptions<TResult> {
  check: () => Promise<TResult>;
  isReady: (result: TResult) => boolean;
  intervalMs?: number;
  signal?: AbortSignal;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Polling aborted'));
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error('Polling aborted'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function pollUntilReady<TResult>({
  check,
  isReady,
  intervalMs = 250,
  signal,
}: PollUntilReadyOptions<TResult>): Promise<TResult> {
  while (true) {
    if (signal?.aborted) {
      throw new Error('Polling aborted');
    }

    const result = await check();
    if (isReady(result)) {
      return result;
    }

    await delay(intervalMs, signal);
  }
}