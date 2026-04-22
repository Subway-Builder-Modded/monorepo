import {
  getActiveSuite,
  getMatchingItem,
  getSuiteById,
  getSuiteDocsNavItem,
  type SiteSuite,
  type SiteSuiteId,
} from "@/config/site-navigation";
import { matchDocsRoute, getDocsTree, findTreeNode } from "@/features/docs";
import { DOCS_HOMEPAGE_TITLE } from "@/config/docs/shared";

const DEFAULT_SITE_TITLE = "Subway Builder Modded";
const DEFAULT_SITE_DESCRIPTION = "The complete hub for everything modded in Subway Builder.";
const DEFAULT_SITE_LOGO_PATH = "/logo.svg";

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

function normalizePathname(pathname: string): string {
  if (!pathname) return "/";

  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (withLeadingSlash !== "/" && withLeadingSlash.endsWith("/")) {
    return withLeadingSlash.slice(0, -1);
  }

  return withLeadingSlash;
}

function getSuiteImagePath(suiteId: SiteSuiteId): string {
  if (suiteId === "general") {
    return DEFAULT_SITE_LOGO_PATH;
  }

  return `/images/${suiteId}/logo.png`;
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
      pageTitle: `${title} | ${suite.title} Docs`,
      imagePath: getSuiteImagePath(docsMatch.suiteId),
    };
  }

  const resolvedSuiteId = override?.suiteId ?? matchedItem?.suiteId ?? activeSuite.id;
  const suite = getSuiteById(resolvedSuiteId);

  const title =
    override?.title ?? matchedItem?.title ?? (suite.id === "general" ? DEFAULT_SITE_TITLE : "Home");
  const description = override?.description ?? matchedItem?.description ?? DEFAULT_SITE_DESCRIPTION;

  return {
    pathname: normalizedPathname,
    title,
    description,
    suite,
    pageTitle: suite.id === "general" ? title : `${title} | ${suite.title}`,
    imagePath: getSuiteImagePath(suite.id),
  };
}
