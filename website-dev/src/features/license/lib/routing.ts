import type { LicenseRouteMatch } from "./types";
import { createSimpleRouteMatcher } from "@/lib/routing";

const LICENSE_ROUTE = "/license";
const licenseRoute = createSimpleRouteMatcher(LICENSE_ROUTE, "license");

export function matchLicenseRoute(pathname: string): LicenseRouteMatch {
  return licenseRoute.match(pathname);
}

export function getLicensePageUrl(): string {
  return licenseRoute.getUrl();
}
