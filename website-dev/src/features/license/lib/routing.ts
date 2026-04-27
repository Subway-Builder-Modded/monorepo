import type { LicenseRouteMatch } from "./types";

const LICENSE_ROUTE = "/license";

export function matchLicenseRoute(pathname: string): LicenseRouteMatch {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (normalized === LICENSE_ROUTE) {
    return { kind: "page", pageId: "license" };
  }

  return { kind: "none" };
}

export function getLicensePageUrl(): string {
  return LICENSE_ROUTE;
}
