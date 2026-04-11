export interface WailsEventSubscription<TPayload = unknown> {
  eventName: string;
  handler: (payload: TPayload) => void;
}

export type WailsEventSubscriber = <TPayload>(
  eventName: string,
  handler: (payload: TPayload) => void,
) => () => void;

export function subscribeToWailsEvents(
  subscribe: WailsEventSubscriber,
  subscriptions: readonly WailsEventSubscription<any>[],
): () => void {
  const cleanups = subscriptions.map((subscription) =>
    subscribe(subscription.eventName, subscription.handler),
  );

  return () => {
    for (const cleanup of cleanups) {
      cleanup();
    }
  };
}