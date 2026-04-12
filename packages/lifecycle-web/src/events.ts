import { useEffect, useState } from 'react';

/**
 * Tracks page visibility state (visible or hidden).
 *
 * Returns 'visible' when the page is in focus, 'hidden' when minimized,
 * switched to another tab, or otherwise out of focus.
 *
 * @returns Current visibility state: 'visible' | 'hidden'
 *
 * @example
 * const visibility = useVisibilityChange();
 * if (visibility === 'hidden') {
 *   pauseBackgroundOperations();
 * }
 */
export function useVisibilityChange(): 'visible' | 'hidden' {
  const [visibility, setVisibility] = useState<'visible' | 'hidden'>(() => {
    if (typeof window === 'undefined') {
      return 'visible';
    }
    return document.hidden ? 'hidden' : 'visible';
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setVisibility(document.hidden ? 'hidden' : 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return visibility;
}

/**
 * Tracks online/offline status.
 *
 * Returns true when the browser has network connectivity, false when offline.
 * Subscribes to 'online' and 'offline' events to reflect network changes.
 *
 * @returns Current online state: true (online) | false (offline)
 *
 * @example
 * const isOnline = useOnlineStatus();
 * if (!isOnline) {
 *   showOfflineIndicator();
 * }
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    return navigator.onLine;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
