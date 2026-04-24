import { getUpdatesSuiteConfig, isUpdatesSuiteId } from "@/config/updates";
import type { UpdatesRouteMatch } from "./types";

export function matchUpdatesRoute(pathname: string): UpdatesRouteMatch {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 2 || segments[1] !== "updates") {
    return { kind: "none" };
  }

  const suiteId = segments[0];
  if (!isUpdatesSuiteId(suiteId)) {
    return { kind: "none" };
  }

  const config = getUpdatesSuiteConfig(suiteId);
  if (!config) {
    return { kind: "none" };
  }

  if (segments.length === 2) {
    return { kind: "homepage", suiteId };
  }

  if (segments.length >= 3) {
    const slug = segments.slice(2).join("/");
    return { kind: "update", suiteId, slug };
  }

  return {
    kind: "not-found",
    suiteId,
    reason: "Updates routes support /<suite>/updates and /<suite>/updates/<slug>",
  };
}

export function getUpdatesHomepageUrl(suiteId: string): string {
  return `/${suiteId}/updates`;
}

export function getUpdatePageUrl(suiteId: string, slug: string): string {
  return `/${suiteId}/updates/${slug}`;
}
