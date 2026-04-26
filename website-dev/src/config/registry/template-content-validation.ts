import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import * as icons from "lucide-react";

export type RegistryTemplateFrontmatter = {
  title: string;
  description: string;
  author: string;
  dateUpdated: string;
  icon: string;
  verified: boolean;
};

type RegistryTemplatesValidationResult = {
  errors: string[];
  rawByPath: Record<string, string>;
  frontmatterByPath: Record<string, RegistryTemplateFrontmatter>;
};

function findMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMdxFiles(fullPath));
      continue;
    }

    if (entry.name.endsWith(".mdx")) {
      results.push(fullPath);
    }
  }

  return results;
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === value;
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

function normalizeFrontmatter(
  filePath: string,
  raw: string,
  errors: string[],
): RegistryTemplateFrontmatter {
  const parsed = matter(raw).data as Record<string, unknown>;
  const title = parsed.title;
  const description = parsed.description;
  const author = parsed.author;
  const dateUpdated = parsed.dateUpdated;
  const icon = parsed.icon;
  const verified = parsed.verified;

  if (typeof title !== "string" || !title.trim()) {
    errors.push(`${filePath}: missing required frontmatter field "title"`);
  }

  if (typeof description !== "string" || !description.trim()) {
    errors.push(`${filePath}: missing required frontmatter field "description"`);
  }

  if (typeof author !== "string" || !author.trim()) {
    errors.push(`${filePath}: missing required frontmatter field "author"`);
  }

  const normalizedDateUpdated =
    typeof dateUpdated === "string"
      ? dateUpdated
      : dateUpdated instanceof Date
        ? dateUpdated.toISOString().slice(0, 10)
        : "";

  if (!normalizedDateUpdated.trim()) {
    errors.push(`${filePath}: missing required frontmatter field "dateUpdated"`);
  } else if (!isValidIsoDate(normalizedDateUpdated)) {
    errors.push(`${filePath}: frontmatter "dateUpdated" must be an ISO date (YYYY-MM-DD)`);
  }

  if (typeof icon !== "string" || !icon.trim()) {
    errors.push(`${filePath}: missing required frontmatter field "icon"`);
  } else if (!isValidIconExport(icon)) {
    errors.push(`${filePath}: invalid icon "${icon}" (must match a lucide-react export)`);
  }

  if (typeof verified !== "boolean") {
    errors.push(`${filePath}: frontmatter "verified" must be a boolean`);
  }

  return {
    title: typeof title === "string" ? title : "",
    description: typeof description === "string" ? description : "",
    author: typeof author === "string" ? author : "",
    dateUpdated: normalizedDateUpdated,
    icon: typeof icon === "string" ? icon : "",
    verified: verified === true,
  };
}

function parseVirtualPath(contentRoot: string, absolutePath: string): string | null {
  const relativePath = path.relative(contentRoot, absolutePath).replace(/\\/g, "/");
  if (!/^registry\/templates\/.+\.mdx$/.test(relativePath)) {
    return null;
  }

  return `/content/${relativePath}`;
}

export function collectRegistryTemplatesContent(contentRoot: string): RegistryTemplatesValidationResult {
  const errors: string[] = [];
  const files = findMdxFiles(contentRoot);
  const rawByPath: Record<string, string> = {};
  const frontmatterByPath: Record<string, RegistryTemplateFrontmatter> = {};

  for (const absolutePath of files) {
    const virtualPath = parseVirtualPath(contentRoot, absolutePath);
    if (!virtualPath) {
      continue;
    }

    const raw = fs.readFileSync(absolutePath, "utf-8");
    const frontmatter = normalizeFrontmatter(absolutePath, raw, errors);

    rawByPath[virtualPath] = raw;
    frontmatterByPath[virtualPath] = frontmatter;
  }

  return {
    errors,
    rawByPath,
    frontmatterByPath,
  };
}

export function assertRegistryTemplatesContentValid(contentRoot: string): void {
  const result = collectRegistryTemplatesContent(contentRoot);
  if (result.errors.length === 0) {
    return;
  }

  const details = result.errors.map((error) => ` - ${error}`).join("\n");
  throw new Error(`[registry-templates] Validation failed:\n${details}`);
}
