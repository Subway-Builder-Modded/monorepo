import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { findMdxFiles, isValidIconExport } from "../shared/content-validation-utils";
import type {
  RegistryTemplateListingFrontmatter,
  RegistryTemplateVersionFrontmatter,
} from "@/lib/registry/template-types";

type StoredFrontmatter = RegistryTemplateListingFrontmatter | RegistryTemplateVersionFrontmatter;

type RegistryTemplatesValidationResult = {
  errors: string[];
  rawByPath: Record<string, string>;
  frontmatterByPath: Record<string, StoredFrontmatter>;
};

/**
 * Validate and normalise a listing.mdx frontmatter.
 * The body of the file is the listing page content (markdown prose).
 */
function normalizeListingFrontmatter(
  filePath: string,
  raw: string,
  errors: string[],
): RegistryTemplateListingFrontmatter {
  const parsed = matter(raw).data as Record<string, unknown>;
  const { title, description, author, icon, verified } = parsed;

  if (typeof title !== "string" || !title.trim()) {
    errors.push(`${filePath}: missing required frontmatter field "title"`);
  }
  if (typeof description !== "string" || !description.trim()) {
    errors.push(`${filePath}: missing required frontmatter field "description"`);
  }
  if (typeof author !== "string" || !author.trim()) {
    errors.push(`${filePath}: missing required frontmatter field "author"`);
  }
  if (typeof icon !== "string" || !icon.trim()) {
    errors.push(`${filePath}: missing required frontmatter field "icon"`);
  } else if (!isValidIconExport(icon)) {
    errors.push(`${filePath}: invalid icon "${icon}" (must match a lucide-react export)`);
  }
  if (verified !== undefined && typeof verified !== "boolean") {
    errors.push(`${filePath}: frontmatter "verified" must be a boolean`);
  }

  return {
    title: typeof title === "string" ? title : "",
    description: typeof description === "string" ? description : "",
    author: typeof author === "string" ? author : "",
    icon: typeof icon === "string" ? icon : "",
    verified: verified === true,
  };
}

/**
 * Validate and normalise a version file frontmatter.
 * The file body is the markdown pasted into the playground when the version is used.
 */
function normalizeVersionFrontmatter(
  filePath: string,
  raw: string,
  errors: string[],
): RegistryTemplateVersionFrontmatter {
  const parsed = matter(raw).data as Record<string, unknown>;
  const { version, datePublished } = parsed;

  if (typeof version !== "string" || !version.trim()) {
    errors.push(`${filePath}: missing required frontmatter field "version"`);
  }

  const normalizedDate =
    typeof datePublished === "string"
      ? datePublished
      : datePublished instanceof Date
        ? datePublished.toISOString().slice(0, 10)
        : "";

  if (!normalizedDate.trim()) {
    errors.push(`${filePath}: missing required frontmatter field "datePublished"`);
  }

  return {
    version: typeof version === "string" ? version : "",
    datePublished: normalizedDate,
  };
}

/** Returns `{ virtualPath, kind }` for template files, or null if not a template path. */
function classifyPath(
  contentRoot: string,
  absolutePath: string,
): { virtualPath: string; kind: "listing" | "version" } | null {
  const relativePath = path.relative(contentRoot, absolutePath).replace(/\\/g, "/");

  if (/^registry\/templates\/[^/]+\/listing\.mdx$/.test(relativePath)) {
    return { virtualPath: `/content/${relativePath}`, kind: "listing" };
  }

  if (/^registry\/templates\/[^/]+\/[^/]+\.mdx$/.test(relativePath)) {
    return { virtualPath: `/content/${relativePath}`, kind: "version" };
  }

  return null;
}

export function collectRegistryTemplatesContent(
  contentRoot: string,
): RegistryTemplatesValidationResult {
  const errors: string[] = [];
  const files = findMdxFiles(contentRoot);
  const rawByPath: Record<string, string> = {};
  const frontmatterByPath: Record<string, StoredFrontmatter> = {};

  for (const absolutePath of files) {
    const classified = classifyPath(contentRoot, absolutePath);
    if (!classified) continue;

    const raw = fs.readFileSync(absolutePath, "utf-8");
    rawByPath[classified.virtualPath] = raw;

    const frontmatter =
      classified.kind === "listing"
        ? normalizeListingFrontmatter(absolutePath, raw, errors)
        : normalizeVersionFrontmatter(absolutePath, raw, errors);
    frontmatterByPath[classified.virtualPath] = frontmatter;
  }

  return { errors, rawByPath, frontmatterByPath };
}

export function assertRegistryTemplatesContentValid(contentRoot: string): void {
  const result = collectRegistryTemplatesContent(contentRoot);
  if (result.errors.length === 0) return;
  const details = result.errors.map((e) => ` - ${e}`).join("\n");
  throw new Error(`[registry-templates] Validation failed:\n${details}`);
}
