import { createSimpleRouteMatcher } from "@/lib/routing";

const termsOfServiceRoute = createSimpleRouteMatcher("/terms-of-service", "terms-of-service");

export function matchTermsOfServiceRoute(pathname: string) {
  return termsOfServiceRoute.match(pathname);
}

export function getTermsOfServicePageUrl(): string {
  return termsOfServiceRoute.getUrl();
}
