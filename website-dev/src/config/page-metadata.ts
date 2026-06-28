import {
  getActiveSuite,
  getMatchingItem,
  getSuiteById,
  getItemsForSuite,
  getSuiteDocsNavItem,
  getSuiteUpdatesNavItem,
  type SiteSuite,
  type SiteSuiteId,
} from "@/config/site-navigation";
import { normalizePathname } from "@/lib/path-utils";
import { matchDocsRoute, getDocsTree, findTreeNode } from "@/features/docs";
import { DOCS_HOMEPAGE_TITLE } from "@/config/docs/shared";
import { matchUpdatesRoute, findUpdateEntry, getUpdateArticleIdentity } from "@/features/updates";
import { UPDATES_HOMEPAGE_TITLE } from "@/config/updates/shared";
import { matchRegistryRoute } from "@/features/registry/lib/routing";

const DEFAULT_SITE_TITLE = "Subway Builder Modded";
const DEFAULT_SITE_DESCRIPTION = "The complete hub for everything modded in Subway Builder.";
const DEFAULT_SITE_LOGO_PATH = "/logo.svg";
const REGISTRY_CACHE_PUBLIC_BASE = "/registry-cache";

type PageMetadataDefinition = {
  title: string;
  description: string;
  suiteId: SiteSuiteId;
};

export type ResolvedPageMetadata = {
  pathname: string;
  title: string;
  description: string;
  suite: SiteSuite;
  pageTitle: string;
  imagePath: string;
};

const PAGE_METADATA_OVERRIDES: Record<string, PageMetadataDefinition> = {
  "/": {
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_SITE_DESCRIPTION,
    suiteId: "general",
  },
};

type RegistryAuthorIndex = {
  authors?: Array<{
    author_id?: string;
    author_alias?: string;
  }>;
};

type RegistryManifestMetadata = {
  name?: string;
  description?: string;
};

function formatPageTitle(title: string, suite: SiteSuite): string {
  return suite.id === "general" || title === suite.title ? title : `${title} | ${suite.title}`;
}

function getSuiteHomeNavItem(suiteId: SiteSuiteId) {
  return getItemsForSuite(suiteId).find((item) => item.id === `${suiteId}-home`) ?? null;
}

function getSuiteImagePath(suiteId: SiteSuiteId): string {
  if (suiteId === "general") {
    return DEFAULT_SITE_LOGO_PATH;
  }

  return `/images/${suiteId}/logo.png`;
}

function toPlainTextExcerpt(markdown: string, maxLength = 180): string {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plainText.length <= maxLength) return plainText;
  return `${plainText.slice(0, maxLength - 1).trimEnd()}…`;
}

function getRegistryEntityDescription(name: string) {
  return `View the Registry statistics, analytics, and listings for ${name}.`;
}

async function safeFetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function resolveRegistryMetadata(
  normalizedPathname: string,
  fallback: ResolvedPageMetadata,
): Promise<ResolvedPageMetadata> {
  const route = matchRegistryRoute(normalizedPathname);
  const registrySuite = getSuiteById("registry");

  if (route.kind === "detail") {
    const manifest = await safeFetchJson<RegistryManifestMetadata>(
      `${REGISTRY_CACHE_PUBLIC_BASE}/${route.routeSegment}/${encodeURIComponent(route.id)}/manifest.json`,
    );
    if (!manifest?.name) return fallback;

    return {
      ...fallback,
      title: manifest.name,
      description: toPlainTextExcerpt(manifest.description ?? fallback.description),
      suite: registrySuite,
      pageTitle: formatPageTitle(manifest.name, registrySuite),
      imagePath: getSuiteImagePath("registry"),
    };
  }

  if (route.kind !== "author" && route.kind !== "project") {
    return fallback;
  }

  const authorsIndex =
    (await safeFetchJson<RegistryAuthorIndex>(
      `${REGISTRY_CACHE_PUBLIC_BASE}/authors/index.json`,
    )) ?? {};
  const author = authorsIndex.authors?.find(
    (entry) => entry.author_id?.toLowerCase() === route.authorId.toLowerCase(),
  );
  const authorName = author?.author_alias?.trim() || route.authorId;
  const title = route.kind === "project" ? route.projectName : authorName;

  return {
    ...fallback,
    title,
    description: getRegistryEntityDescription(title),
    suite: registrySuite,
    pageTitle: formatPageTitle(title, registrySuite),
    imagePath: getSuiteImagePath("registry"),
  };
}

export function resolvePageMetadata(pathname: string): ResolvedPageMetadata {
  const normalizedPathname = normalizePathname(pathname);
  const override = PAGE_METADATA_OVERRIDES[normalizedPathname];
  const activeSuite = getActiveSuite(normalizedPathname);
  const matchedItem = getMatchingItem(normalizedPathname, activeSuite.id);

  const docsMatch = matchDocsRoute(normalizedPathname, "");
  if (docsMatch.kind === "homepage" || docsMatch.kind === "doc") {
    const suite = getSuiteById(docsMatch.suiteId);

    if (docsMatch.kind === "homepage") {
      const title = DOCS_HOMEPAGE_TITLE;
      return {
        pathname: normalizedPathname,
        title,
        description:
          getSuiteDocsNavItem(docsMatch.suiteId)?.description ?? DEFAULT_SITE_DESCRIPTION,
        suite,
        pageTitle: `${title} | ${suite.title}`,
        imagePath: getSuiteImagePath(docsMatch.suiteId),
      };
    }

    // doc page
    const tree = getDocsTree(docsMatch.suiteId, docsMatch.version);
    const node = findTreeNode(tree, docsMatch.slug);
    const title = node?.frontmatter.title ?? "Documentation";
    const description = node?.frontmatter.description ?? DEFAULT_SITE_DESCRIPTION;

    return {
      pathname: normalizedPathname,
      title,
      description,
      suite,
      pageTitle: formatPageTitle(title, suite),
      imagePath: getSuiteImagePath(docsMatch.suiteId),
    };
  }

  const updatesMatch = matchUpdatesRoute(normalizedPathname);
  if (updatesMatch.kind === "homepage" || updatesMatch.kind === "update") {
    const suite = getSuiteById(updatesMatch.suiteId);

    if (updatesMatch.kind === "homepage") {
      return {
        pathname: normalizedPathname,
        title: UPDATES_HOMEPAGE_TITLE,
        description:
          getSuiteUpdatesNavItem(updatesMatch.suiteId)?.description ?? DEFAULT_SITE_DESCRIPTION,
        suite,
        pageTitle: `${UPDATES_HOMEPAGE_TITLE} | ${suite.title}`,
        imagePath: getSuiteImagePath(updatesMatch.suiteId),
      };
    }

    const update = findUpdateEntry(updatesMatch.suiteId, updatesMatch.slug);
    const updateIdentity = getUpdateArticleIdentity(update);

    return {
      pathname: normalizedPathname,
      title: updateIdentity.title,
      description: `${updateIdentity.title} changelog and release notes for ${suite.title}.`,
      suite,
      pageTitle: formatPageTitle(updateIdentity.title, suite),
      imagePath: getSuiteImagePath(updatesMatch.suiteId),
    };
  }

  const resolvedSuiteId = override?.suiteId ?? matchedItem?.suiteId ?? activeSuite.id;
  const suite = getSuiteById(resolvedSuiteId);
  const suiteHomeItem = getSuiteHomeNavItem(suite.id);

  const title =
    override?.title ??
    (matchedItem?.id === `${suite.id}-home` ? suite.title : matchedItem?.title) ??
    suiteHomeItem?.title ??
    (suite.id === "general" ? DEFAULT_SITE_TITLE : "Home");
  const description =
    override?.description ??
    matchedItem?.description ??
    suiteHomeItem?.description ??
    DEFAULT_SITE_DESCRIPTION;

  return {
    pathname: normalizedPathname,
    title,
    description,
    suite,
    pageTitle: formatPageTitle(title, suite),
    imagePath: getSuiteImagePath(suite.id),
  };
}

export async function resolvePageMetadataAsync(pathname: string): Promise<ResolvedPageMetadata> {
  const fallback = resolvePageMetadata(pathname);

  if (fallback.suite.id !== "registry") {
    return fallback;
  }

  return resolveRegistryMetadata(fallback.pathname, fallback);
}
