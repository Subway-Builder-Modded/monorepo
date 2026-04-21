import type { DocsRouteVersion, DocsSuiteId } from "@/app/config/docs";
import {
  getDefaultDocForVersion,
  getDocsSuiteConfig,
  getDocsVersion,
  isDocsSuiteId,
  isVersionedDocsSuite,
  getLatestVersion,
} from "@/app/config/docs";
import type { ResolvedDocsRoute } from "./types";
import { findTreeNode, getDocsTree } from "./content";

type DocsRouteMatch =
  | { kind: "none" }
  | { kind: "homepage"; suiteId: DocsSuiteId; version: DocsRouteVersion }
  | { kind: "doc"; suiteId: DocsSuiteId; version: DocsRouteVersion; slug: string }
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

  const params = new URLSearchParams(search);
  const versionParam = params.get("version");

  if (!config.versioned) {
    // Canonical homepage for non-versioned suites is /<suite>/docs with no query.
    if (segments.length === 2) {
      if (versionParam) {
        return { kind: "redirect", to: `/${suiteId}/docs` };
      }
      return { kind: "homepage", suiteId, version: null };
    }

    const slug = segments.slice(2).join("/");
    if (!slug) {
      return { kind: "homepage", suiteId, version: null };
    }

    return { kind: "doc", suiteId, version: null, slug };
  }

  const latest = getLatestVersion(suiteId)!;

  // /<suite>/docs
  if (segments.length === 2) {
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
    const slug = segments.slice(3).join("/");
    return { kind: "redirect", to: `/${suiteId}/docs/${latest}/${slug}` };
  }

  const versionConfig = getDocsVersion(suiteId, maybeVersion);

  if (versionConfig) {
    if (segments.length === 3) {
      return { kind: "redirect", to: `/${suiteId}/docs?version=${maybeVersion}` };
    }

    const slug = segments.slice(3).join("/");
    return { kind: "doc", suiteId, version: maybeVersion, slug };
  }

  return {
    kind: "not-found",
    suiteId,
    reason: `Unknown version or path: ${maybeVersion}`,
  };
}

export function resolveDocsRoute(pathname: string, search: string): ResolvedDocsRoute | null {
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

export function getDocsHomepageUrl(suiteId: string, version?: string | null): string {
  if (version && isDocsSuiteId(suiteId) && isVersionedDocsSuite(suiteId)) {
    return `/${suiteId}/docs?version=${version}`;
  }
  return `/${suiteId}/docs`;
}

export function getDocPageUrl(suiteId: string, version: string | null, slug: string): string {
  if (version && isDocsSuiteId(suiteId) && isVersionedDocsSuite(suiteId)) {
    return `/${suiteId}/docs/${version}/${slug}`;
  }

  return `/${suiteId}/docs/${slug}`;
}

function canUseDocSlugInVersion(suiteId: DocsSuiteId, version: string, slug: string): boolean {
  const tree = getDocsTree(suiteId, version);
  const node = findTreeNode(tree, slug);
  return !!node && !node.frontmatter.hidden;
}

function resolveVersionDocSlug(
  suiteId: DocsSuiteId,
  targetVersion: string,
  requestedSlug: string | null,
): string | null {
  if (requestedSlug && canUseDocSlugInVersion(suiteId, targetVersion, requestedSlug)) {
    return requestedSlug;
  }

  const defaultDoc = getDefaultDocForVersion(suiteId, targetVersion);
  if (defaultDoc && canUseDocSlugInVersion(suiteId, targetVersion, defaultDoc)) {
    return defaultDoc;
  }

  return null;
}

export function getVersionSwitchUrl(
  suiteId: DocsSuiteId,
  targetVersion: string,
  requestedSlug: string | null,
): string {
  if (!isVersionedDocsSuite(suiteId)) {
    return getDocsHomepageUrl(suiteId);
  }

  const slug = resolveVersionDocSlug(suiteId, targetVersion, requestedSlug);
  if (slug) {
    return getDocPageUrl(suiteId, targetVersion, slug);
  }

  return getDocsHomepageUrl(suiteId, targetVersion);
}
