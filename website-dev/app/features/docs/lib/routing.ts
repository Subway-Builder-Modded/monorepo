import type { DocsSuiteId } from "@/app/config/docs";
import {
  isDocsSuiteId,
  getDocsSuiteConfig,
  getDocsVersion,
  getLatestVersion,
} from "@/app/config/docs";
import type { ResolvedDocsRoute } from "./types";

type DocsRouteMatch =
  | { kind: "none" }
  | { kind: "homepage"; suiteId: DocsSuiteId; version: string }
  | { kind: "doc"; suiteId: DocsSuiteId; version: string; slug: string }
  | { kind: "redirect"; to: string }
  | { kind: "not-found"; suiteId: DocsSuiteId; reason: string };

export function matchDocsRoute(pathname: string, search: string): DocsRouteMatch {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 2 || segments[1] !== "docs") {
    return { kind: "none" };
  }

  const suiteId = segments[0];
  if (!isDocsSuiteId(suiteId)) {
    return { kind: "none" };
  }

  const config = getDocsSuiteConfig(suiteId);
  if (!config) {
    return { kind: "none" };
  }

  const latest = getLatestVersion(suiteId)!;

  // /<suite>/docs
  if (segments.length === 2) {
    const params = new URLSearchParams(search);
    const versionParam = params.get("version");

    if (versionParam) {
      if (versionParam === "latest") {
        return { kind: "redirect", to: `/${suiteId}/docs?version=${latest}` };
      }
      const versionConfig = getDocsVersion(suiteId, versionParam);
      if (!versionConfig) {
        return { kind: "redirect", to: `/${suiteId}/docs?version=${latest}` };
      }
      return { kind: "homepage", suiteId, version: versionParam };
    }

    return { kind: "homepage", suiteId, version: latest };
  }

  const maybeVersion = segments[2];

  // /<suite>/docs/latest
  if (maybeVersion === "latest") {
    if (segments.length === 3) {
      return { kind: "redirect", to: `/${suiteId}/docs?version=${latest}` };
    }
    // /<suite>/docs/latest/...slug
    const slug = segments.slice(3).join("/");
    return { kind: "redirect", to: `/${suiteId}/docs/${latest}/${slug}` };
  }

  const versionConfig = getDocsVersion(suiteId, maybeVersion);

  if (versionConfig) {
    // /<suite>/docs/<version> — redirect to homepage with query
    if (segments.length === 3) {
      return { kind: "redirect", to: `/${suiteId}/docs?version=${maybeVersion}` };
    }

    // /<suite>/docs/<version>/...slug
    const slug = segments.slice(3).join("/");
    return { kind: "doc", suiteId, version: maybeVersion, slug };
  }

  // Unknown version — could be a slug attempt without version, show not-found
  return {
    kind: "not-found",
    suiteId,
    reason: `Unknown version or path: ${maybeVersion}`,
  };
}

export function resolveDocsRoute(
  pathname: string,
  search: string,
): ResolvedDocsRoute | null {
  const match = matchDocsRoute(pathname, search);

  switch (match.kind) {
    case "homepage":
      return {
        suiteId: match.suiteId,
        version: match.version,
        docSlug: null,
        isHomepage: true,
      };
    case "doc":
      return {
        suiteId: match.suiteId,
        version: match.version,
        docSlug: match.slug,
        isHomepage: false,
      };
    default:
      return null;
  }
}

export function getDocsHomepageUrl(suiteId: string, version?: string): string {
  if (version) {
    return `/${suiteId}/docs?version=${version}`;
  }
  return `/${suiteId}/docs`;
}

export function getDocPageUrl(
  suiteId: string,
  version: string,
  slug: string,
): string {
  return `/${suiteId}/docs/${version}/${slug}`;
}

export function findSamePathInVersion(
  suiteId: DocsSuiteId,
  targetVersion: string,
  slug: string,
): string | null {
  const versionConfig = getDocsVersion(suiteId, targetVersion);
  if (!versionConfig) return null;
  // This will be checked against actual tree content by the caller
  return `/${suiteId}/docs/${targetVersion}/${slug}`;
}
