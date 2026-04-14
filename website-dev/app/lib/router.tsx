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

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

export function navigate(to: string) {
  const nextPath = to.startsWith("/") ? to : `/${to}`;
  const nextHref = addBasePath(nextPath);

  if (window.location.pathname === nextHref) {
    return;
  }

  window.history.pushState({}, "", nextHref);
  emitNavigation();
}

export function useNavigate() {
  return useCallback((to: string) => navigate(to), []);
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
      if (event.defaultPrevented) return;
      if (target && target !== "_self") return;
      if (isModifiedClick(event)) return;
      if (to.startsWith("http://") || to.startsWith("https://")) return;
      if (to.startsWith("mailto:") || to.startsWith("tel:")) return;

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
