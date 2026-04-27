import {
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";

const NAVIGATION_EVENT = "sbm:navigate";

const BASE_URL = import.meta.env.BASE_URL ?? "/";

function normalizeBasePath(basePath: string): string {
  if (!basePath || basePath === "/") {
    return "/";
  }

  const prefixed = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return prefixed.endsWith("/") ? prefixed.slice(0, -1) : prefixed;
}

const BASE_PATH = normalizeBasePath(BASE_URL);

type LocationState = {
  pathname: string;
  search: string;
  hash: string;
};

type LocationSnapshot = {
  pathname: string;
  search: string;
  hash: string;
};

function emitNavigation() {
  window.dispatchEvent(new Event(NAVIGATION_EVENT));
}

function stripBasePath(pathname: string): string {
  if (BASE_PATH === "/") {
    return pathname || "/";
  }

  if (pathname === BASE_PATH) {
    return "/";
  }

  if (pathname.startsWith(`${BASE_PATH}/`)) {
    return pathname.slice(BASE_PATH.length) || "/";
  }

  return pathname || "/";
}

function addBasePath(pathname: string): string {
  if (BASE_PATH === "/") {
    return pathname;
  }

  if (pathname === "/") {
    return BASE_PATH;
  }

  return `${BASE_PATH}${pathname}`;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  window.addEventListener(NAVIGATION_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener(NAVIGATION_EVENT, onStoreChange);
  };
}

function getLocationSnapshot(): LocationSnapshot {
  return {
    pathname: stripBasePath(window.location.pathname),
    search: window.location.search,
    hash: window.location.hash,
  };
}

function getSnapshot(): string {
  const snapshot = getLocationSnapshot();
  return `${snapshot.pathname}${snapshot.search}${snapshot.hash}`;
}

function getServerSnapshot(): string {
  return "/";
}

function getServerLocationSnapshot(): LocationSnapshot {
  return {
    pathname: "/",
    search: "",
    hash: "",
  };
}

function isExternalNavigationTarget(to: string) {
  return (
    to.startsWith("http://") ||
    to.startsWith("https://") ||
    to.startsWith("mailto:") ||
    to.startsWith("tel:")
  );
}

export type LinkNavigationIntent = {
  defaultPrevented: boolean;
  target?: string;
  to: string;
  metaKey?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
};

export function shouldHandleClientNavigation(intent: LinkNavigationIntent) {
  if (intent.defaultPrevented) return false;
  if (intent.target && intent.target !== "_self") return false;
  if (intent.metaKey || intent.altKey || intent.ctrlKey || intent.shiftKey) return false;
  if (isExternalNavigationTarget(intent.to)) return false;

  return true;
}

export function navigate(to: string) {
  const nextPath = to.startsWith("/") ? to : `/${to}`;
  const nextHref = addBasePath(nextPath);

  if (window.location.pathname === nextHref) {
    return;
  }

  window.history.pushState({}, "", nextHref);
  window.scrollTo(0, 0);
  emitNavigation();
}

export function useLocation(): LocationState {
  const key = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(() => {
    if (typeof window === "undefined") {
      return getServerLocationSnapshot();
    }

    const snapshot = getLocationSnapshot();
    const expectedKey = `${snapshot.pathname}${snapshot.search}${snapshot.hash}`;
    if (expectedKey !== key) {
      return {
        pathname: stripBasePath(window.location.pathname),
        search: window.location.search,
        hash: window.location.hash,
      };
    }

    return snapshot;
  }, [key]);
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  children: ReactNode;
};

export function Link({ to, onClick, target, rel, children, ...props }: LinkProps) {
  const href =
    to.startsWith("http://") ||
    to.startsWith("https://") ||
    to.startsWith("mailto:") ||
    to.startsWith("tel:")
      ? to
      : addBasePath(to.startsWith("/") ? to : `/${to}`);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (
        !shouldHandleClientNavigation({
          defaultPrevented: event.defaultPrevented,
          target,
          to,
          metaKey: event.metaKey,
          altKey: event.altKey,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
        })
      ) {
        return;
      }

      event.preventDefault();
      navigate(to);
    },
    [onClick, target, to],
  );

  return (
    <a href={href} onClick={handleClick} target={target} rel={rel} {...props}>
      {children}
    </a>
  );
}
