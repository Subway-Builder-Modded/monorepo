import {
  getPendingStartupPhases,
  pollUntilReady,
  runStartupPhases,
  type StartupPhase,
} from '@subway-builder-modded/lifecycle-core';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  resolveWailsDeepLink,
  type WailsDeepLinkTarget,
} from './deeplinks';
import {
  subscribeToWailsEvents,
  type WailsEventSubscriber,
  type WailsEventSubscription,
} from './events';

interface ConsumePendingDeepLinkResult {
  status: string;
  target?: WailsDeepLinkTarget;
}

interface WailsStartupPhaseState {
  startupReady: boolean;
}

export interface UseWailsStartupParams<TPhaseName extends string = string> {
  subscribe: WailsEventSubscriber;
  pollStartupReady: () => Promise<boolean>;
  phases: (state: WailsStartupPhaseState) => readonly StartupPhase<TPhaseName>[];
  eventSubscriptions?: readonly WailsEventSubscription<any>[];
  consumePendingDeepLink?: () => Promise<ConsumePendingDeepLinkResult>;
  getProjectRoute?: (type: string, id: string) => string;
  launchGame?: () => void | Promise<void>;
  canNavigatePendingRoute?: boolean;
  navigate?: (route: string) => void;
}

export interface UseWailsStartupResult {
  startupReady: boolean;
  fatalError: string | null;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useWailsStartup<TPhaseName extends string = string>({
  subscribe,
  pollStartupReady,
  phases,
  eventSubscriptions = [],
  consumePendingDeepLink,
  getProjectRoute,
  launchGame,
  canNavigatePendingRoute = false,
  navigate,
}: UseWailsStartupParams<TPhaseName>): UseWailsStartupResult {
  const [startupReady, setStartupReady] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const completedPhasesRef = useRef<Set<TPhaseName>>(new Set());
  const runningPhasesRef = useRef<Set<TPhaseName>>(new Set());
  const consumedInitialDeepLinkRef = useRef(false);

  const resolvedPhases = useMemo(
    () => phases({ startupReady }),
    [phases, startupReady],
  );

  useEffect(() => {
    const onWindowError = (event: ErrorEvent) => {
      setFatalError(
        event.error instanceof Error
          ? event.error.message
          : event.message || 'Unexpected application error',
      );
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      setFatalError(toErrorMessage(event.reason || 'Unhandled promise rejection'));
    };

    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    const subscriptions: WailsEventSubscription<any>[] = [...eventSubscriptions];

    if (getProjectRoute) {
      subscriptions.push({
        eventName: 'deeplink:open',
        handler: (payload: WailsDeepLinkTarget) => {
          const resolved = resolveWailsDeepLink(payload, getProjectRoute);
          if (resolved.shouldLaunchGame) {
            void launchGame?.();
            return;
          }
          if (resolved.route) {
            setPendingRoute(resolved.route);
          }
        },
      });
    }

    const unsubscribe = subscribeToWailsEvents(subscribe, subscriptions);
    const controller = new AbortController();

    void pollUntilReady({
      check: pollStartupReady,
      isReady: Boolean,
      signal: controller.signal,
    })
      .then(() => {
        if (!controller.signal.aborted) {
          setStartupReady(true);
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }
        setFatalError(toErrorMessage(error));
      });

    return () => {
      controller.abort();
      unsubscribe();
    };
  }, [
    eventSubscriptions,
    getProjectRoute,
    launchGame,
    pollStartupReady,
    subscribe,
  ]);

  useEffect(() => {
    const pendingPhases = getPendingStartupPhases(
      resolvedPhases,
      completedPhasesRef.current,
      runningPhasesRef.current,
    );
    if (pendingPhases.length === 0) {
      return;
    }

    let cancelled = false;

    for (const phase of pendingPhases) {
      runningPhasesRef.current.add(phase.name);
    }

    void runStartupPhases(pendingPhases)
      .then((completed) => {
        if (cancelled) {
          return;
        }
        for (const phaseName of completed) {
          runningPhasesRef.current.delete(phaseName);
          completedPhasesRef.current.add(phaseName);
        }
      })
      .catch((error) => {
        for (const phase of pendingPhases) {
          runningPhasesRef.current.delete(phase.name);
        }
        if (!cancelled) {
          setFatalError(toErrorMessage(error));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedPhases]);

  useEffect(() => {
    if (!startupReady || !consumePendingDeepLink || !getProjectRoute) {
      return;
    }
    if (consumedInitialDeepLinkRef.current) {
      return;
    }

    consumedInitialDeepLinkRef.current = true;

    void consumePendingDeepLink()
      .then((response) => {
        if (response.status !== 'success') {
          return;
        }

        const resolved = resolveWailsDeepLink(response.target, getProjectRoute);
        if (resolved.shouldLaunchGame) {
          void launchGame?.();
          return;
        }
        if (resolved.route) {
          setPendingRoute(resolved.route);
        }
      })
      .catch(() => {});
  }, [consumePendingDeepLink, getProjectRoute, launchGame, startupReady]);

  useEffect(() => {
    if (!canNavigatePendingRoute || !navigate || !pendingRoute) {
      return;
    }

    navigate(pendingRoute);
    setPendingRoute(null);
  }, [canNavigatePendingRoute, navigate, pendingRoute]);

  return {
    startupReady,
    fatalError,
  };
}