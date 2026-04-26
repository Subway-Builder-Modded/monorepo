import type { RegistryTemplateFrontmatter } from "@/config/registry/template-content-validation";
import * as icons from "lucide-react";
// @ts-expect-error -- virtual module provided by vite plugin
import rawContentData from "virtual:mdx-raw-content";

type MdxRawContentModule<TFrontmatter = Record<string, unknown>> = {
  rawByPath: Record<string, string>;
  frontmatterByPath: Record<string, TFrontmatter>;
};

export type RegistryTemplate = {
  slug: string;
  title: string;
  description: string;
  author: string;
  dateUpdated: string;
  icon: string;
  verified: boolean;
  body: string;
};

const mdxModules = import.meta.glob("/content/registry/templates/*.mdx");
const mdxRawModules: Record<string, string> =
  (rawContentData as MdxRawContentModule<RegistryTemplateFrontmatter>).rawByPath;
const mdxFrontmatterModules: Record<string, RegistryTemplateFrontmatter> =
  (rawContentData as MdxRawContentModule<RegistryTemplateFrontmatter>).frontmatterByPath;

let templatesCache: RegistryTemplate[] | null = null;

function stripFrontmatter(raw: string): string {
  return raw.replace(/^---[\s\S]*?---\s*/, "").trim();
}

function parseSlug(pathName: string): string {
  const match = pathName.match(/^\/content\/registry\/templates\/(.+)\.mdx$/);
  return match?.[1] ?? pathName;
}

function isValidIconExport(name: string): boolean {
  const value = (icons as Record<string, unknown>)[name];
  if (!value) return false;

  if (typeof value === "function") {
    return true;
  }

  if (typeof value === "object" && value !== null && "$$typeof" in value) {
    return true;
  }

  return false;
}

function assertTemplateShape(
  pathName: string,
  frontmatter: RegistryTemplateFrontmatter | undefined,
): asserts frontmatter is RegistryTemplateFrontmatter {
  if (!frontmatter) {
    throw new Error(`[registry-templates] Missing frontmatter for ${pathName}`);
  }

  if (!frontmatter.title.trim()) {
    throw new Error(`[registry-templates] Missing title for ${pathName}`);
  }

  if (!frontmatter.description.trim()) {
    throw new Error(`[registry-templates] Missing description for ${pathName}`);
  }

  if (!frontmatter.author.trim()) {
    throw new Error(`[registry-templates] Missing author for ${pathName}`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(frontmatter.dateUpdated)) {
    throw new Error(
      `[registry-templates] dateUpdated must be ISO date (YYYY-MM-DD) for ${pathName}`,
    );
  }

  if (typeof frontmatter.verified !== "boolean") {
    throw new Error(`[registry-templates] verified must be a boolean for ${pathName}`);
  }

  if (!isValidIconExport(frontmatter.icon)) {
    throw new Error(
      `[registry-templates] invalid icon "${frontmatter.icon}" (must match a lucide-react export) for ${pathName}`,
    );
  }
}

function discoverTemplates(): RegistryTemplate[] {
  const pathNames = Object.keys(mdxModules).sort((a, b) => a.localeCompare(b));
  const templates: RegistryTemplate[] = [];

  for (const pathName of pathNames) {
    const frontmatter = mdxFrontmatterModules[pathName] as RegistryTemplateFrontmatter | undefined;
    const raw = mdxRawModules[pathName];

    if (!raw) {
      throw new Error(`[registry-templates] Missing raw content for ${pathName}`);
    }

    assertTemplateShape(pathName, frontmatter);

    templates.push({
      slug: parseSlug(pathName),
      title: frontmatter.title,
      description: frontmatter.description,
      author: frontmatter.author,
      dateUpdated: frontmatter.dateUpdated,
      icon: frontmatter.icon,
      verified: frontmatter.verified,
      body: stripFrontmatter(raw),
    });
  }

  return templates;
}

export function getRegistryTemplates(): RegistryTemplate[] {
  if (!templatesCache) {
    templatesCache = discoverTemplates();
  }

  return templatesCache;
}

export function getRegistryTemplateBySlug(slug: string): RegistryTemplate | null {
  return getRegistryTemplates().find((template) => template.slug === slug) ?? null;
}

export function __resetRegistryTemplatesCacheForTests() {
  templatesCache = null;
}
