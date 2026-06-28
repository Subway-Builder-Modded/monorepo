import rawContentData from "virtual:mdx-raw-content";
import type {
  RegistryTemplate,
  RegistryTemplateListingFrontmatter,
  RegistryTemplateVersion,
  RegistryTemplateVersionFrontmatter,
} from "@/lib/registry/template-types";
export type {
  RegistryTemplate,
  RegistryTemplateListingFrontmatter,
  RegistryTemplateVersion,
  RegistryTemplateVersionFrontmatter,
} from "@/lib/registry/template-types";

type AnyStoredFrontmatter = RegistryTemplateListingFrontmatter | RegistryTemplateVersionFrontmatter;

type MdxRawContentModule = {
  rawByPath: Record<string, string>;
  frontmatterByPath: Record<string, AnyStoredFrontmatter>;
};

const mdxRawModules = (rawContentData as MdxRawContentModule).rawByPath;
const mdxFrontmatterModules = (rawContentData as MdxRawContentModule).frontmatterByPath;

let templatesCache: RegistryTemplate[] | null = null;

function stripFrontmatter(raw: string): string {
  return raw.replace(/^---[\s\S]*?---\s*/, "").trim();
}

function parseSemverParts(version: string): number[] {
  return version
    .toLowerCase()
    .replace(/^v/, "")
    .split(".")
    .map((p) => parseInt(p, 10) || 0);
}

function compareVersionsDesc(a: RegistryTemplateVersion, b: RegistryTemplateVersion): number {
  const av = parseSemverParts(a.version);
  const bv = parseSemverParts(b.version);
  const len = Math.max(av.length, bv.length);
  for (let i = 0; i < len; i++) {
    const diff = (bv[i] ?? 0) - (av[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function isListingPath(pathName: string): boolean {
  return pathName.endsWith("/listing.mdx");
}

function assertListingShape(
  pathName: string,
  fm: AnyStoredFrontmatter | undefined,
): asserts fm is RegistryTemplateListingFrontmatter {
  if (!fm) throw new Error(`[registry-templates] Missing frontmatter for ${pathName}`);
  const f = fm as RegistryTemplateListingFrontmatter;
  if (!f.title?.trim()) throw new Error(`[registry-templates] Missing title for ${pathName}`);
  if (!f.description?.trim())
    throw new Error(`[registry-templates] Missing description for ${pathName}`);
  if (!f.author?.trim()) throw new Error(`[registry-templates] Missing author for ${pathName}`);
  if (!f.icon?.trim()) throw new Error(`[registry-templates] Missing icon for ${pathName}`);
}

function assertVersionShape(
  pathName: string,
  fm: AnyStoredFrontmatter | undefined,
): asserts fm is RegistryTemplateVersionFrontmatter {
  if (!fm) throw new Error(`[registry-templates] Missing frontmatter for ${pathName}`);
  const f = fm as RegistryTemplateVersionFrontmatter;
  if (!f.version?.trim()) throw new Error(`[registry-templates] Missing version for ${pathName}`);
  if (!f.datePublished?.trim())
    throw new Error(`[registry-templates] Missing datePublished for ${pathName}`);
}

function discoverTemplates(): RegistryTemplate[] {
  const allPaths = Object.keys(mdxRawModules)
    .filter((p) => p.startsWith("/content/registry/templates/"))
    .sort();

  // Collect unique slugs
  const slugSet = new Set<string>();
  for (const p of allPaths) {
    const m = p.match(/^\/content\/registry\/templates\/([^/]+)\//);
    if (m) slugSet.add(m[1]);
  }

  const templates: RegistryTemplate[] = [];

  for (const slug of slugSet) {
    const listingPath = `/content/registry/templates/${slug}/listing.mdx`;
    const listingRaw = mdxRawModules[listingPath];
    if (!listingRaw) {
      throw new Error(`[registry-templates] Missing listing.mdx for template "${slug}"`);
    }
    const listingFm = mdxFrontmatterModules[listingPath];
    assertListingShape(listingPath, listingFm);

    const descriptionBody = stripFrontmatter(listingRaw);

    const versionPaths = allPaths.filter((p) => {
      if (!p.startsWith(`/content/registry/templates/${slug}/`)) return false;
      if (!p.endsWith(".mdx")) return false;
      return !isListingPath(p);
    });

    const versions: RegistryTemplateVersion[] = [];
    for (const vPath of versionPaths) {
      const vFm = mdxFrontmatterModules[vPath];
      const vRaw = mdxRawModules[vPath];
      if (!vRaw) throw new Error(`[registry-templates] Missing raw content for ${vPath}`);
      assertVersionShape(vPath, vFm);

      versions.push({
        id: `${slug}:${vFm.version}`,
        slug,
        version: vFm.version,
        datePublished: vFm.datePublished,
        body: stripFrontmatter(vRaw),
      });
    }

    if (versions.length === 0) {
      throw new Error(`[registry-templates] No version files found for template "${slug}"`);
    }

    const sortedVersions = [...versions].sort(compareVersionsDesc);
    const latest = sortedVersions[0]!;

    templates.push({
      slug,
      title: listingFm.title,
      description: listingFm.description,
      descriptionBody,
      author: listingFm.author,
      icon: listingFm.icon,
      verified: listingFm.verified === true,
      latestVersion: latest.version,
      latestDatePublished: latest.datePublished,
      versions: sortedVersions,
    });
  }

  return templates.sort((a, b) => a.title.localeCompare(b.title));
}

export function getRegistryTemplates(): RegistryTemplate[] {
  if (!templatesCache) {
    templatesCache = discoverTemplates();
  }
  return templatesCache;
}

export function getRegistryTemplateBySlug(slug: string): RegistryTemplate | null {
  return getRegistryTemplates().find((t) => t.slug === slug) ?? null;
}

export function __resetRegistryTemplatesCacheForTests() {
  templatesCache = null;
}
