import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import * as icons from "lucide-react";
import { DOCS_CONFIG } from "./index";
import type { DocsRouteVersion, DocsSuiteId, DocsFrontmatter } from "./types";

type ParsedContentFile = {
  absolutePath: string;
  virtualPath: string;
  suiteId: DocsSuiteId;
  version: DocsRouteVersion;
  slug: string;
  frontmatter: DocsFrontmatter;
  raw: string;
};

type DocsContentValidationResult = {
  errors: string[];
  rawByPath: Record<string, string>;
  frontmatterByPath: Record<string, DocsFrontmatter>;
};

const VERSION_PATTERN = /^v\d+(?:\.\d+)*$/;

function findMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMdxFiles(fullPath));
    } else if (entry.name.endsWith(".mdx")) {
      results.push(fullPath);
    }
  }
  return results;
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

function normalizeFrontmatter(filePath: string, raw: string, errors: string[]): DocsFrontmatter {
  const parsed = matter(raw).data as Record<string, unknown>;

  const title = parsed.title;
  const description = parsed.description;
  const icon = parsed.icon;
  const hidden = parsed.hidden;

  if (typeof title !== "string" || !title.trim()) {
    errors.push(`${filePath}: missing required frontmatter field "title"`);
  }

  if (typeof description !== "string" || !description.trim()) {
    errors.push(`${filePath}: missing required frontmatter field "description"`);
  }

  if (typeof icon !== "string" || !icon.trim()) {
    errors.push(`${filePath}: missing required frontmatter field "icon"`);
  } else if (!isValidIconExport(icon)) {
    errors.push(`${filePath}: invalid icon "${icon}" (must match a lucide-react export)`);
  }

  if (hidden !== undefined && typeof hidden !== "boolean") {
    errors.push(`${filePath}: frontmatter "hidden" must be a boolean when provided`);
  }

  return {
    title: typeof title === "string" ? title : "",
    description: typeof description === "string" ? description : "",
    icon: typeof icon === "string" ? icon : "",
    hidden: hidden === true,
  };
}

function parseDocsPath(
  absolutePath: string,
  contentRoot: string,
  errors: string[],
): Omit<ParsedContentFile, "frontmatter" | "raw" | "virtualPath"> | null {
  const relativePath = path.relative(contentRoot, absolutePath).replace(/\\/g, "/");
  const withoutExt = relativePath.replace(/\.mdx$/, "");
  const segments = withoutExt.split("/");

  if (segments.length < 2) {
    errors.push(`${absolutePath}: docs file must be nested under a suite folder`);
    return null;
  }

  const suiteCandidate = segments[0];
  if (!(suiteCandidate in DOCS_CONFIG.suites)) {
    errors.push(`${absolutePath}: unknown docs suite "${suiteCandidate}"`);
    return null;
  }

  const suiteId = suiteCandidate as DocsSuiteId;
  const suite = DOCS_CONFIG.suites[suiteId];

  if (suite.versioned) {
    if (segments.length < 3) {
      errors.push(
        `${absolutePath}: versioned suite "${suiteId}" requires /<suite>/<version>/<slug>.mdx`,
      );
      return null;
    }

    const version = segments[1];
    if (!suite.versions.some((v) => v.value === version)) {
      errors.push(`${absolutePath}: unknown version "${version}" for suite "${suiteId}"`);
      return null;
    }

    const slug = segments.slice(2).join("/");
    if (!slug) {
      errors.push(`${absolutePath}: missing slug path after version folder`);
      return null;
    }

    return {
      absolutePath,
      suiteId,
      version,
      slug,
    };
  }

  if (segments.length < 2) {
    errors.push(`${absolutePath}: non-versioned suite "${suiteId}" requires /<suite>/<slug>.mdx`);
    return null;
  }

  if (segments.length >= 3 && VERSION_PATTERN.test(segments[1])) {
    errors.push(
      `${absolutePath}: non-versioned suite "${suiteId}" must not use version folder "${segments[1]}"`,
    );
    return null;
  }

  const slug = segments.slice(1).join("/");
  if (!slug) {
    errors.push(`${absolutePath}: missing slug path for non-versioned suite`);
    return null;
  }

  return {
    absolutePath,
    suiteId,
    version: null,
    slug,
  };
}

function validateLandingPages(files: ParsedContentFile[], errors: string[]) {
  const slugGroups = new Map<string, Set<string>>();

  for (const file of files) {
    const groupKey = `${file.suiteId}:${file.version ?? "__no_version__"}`;
    if (!slugGroups.has(groupKey)) {
      slugGroups.set(groupKey, new Set<string>());
    }
    slugGroups.get(groupKey)!.add(file.slug);
  }

  for (const [groupKey, slugs] of slugGroups.entries()) {
    const folders = new Set<string>();

    for (const slug of slugs) {
      const parts = slug.split("/");
      if (parts.length <= 1) continue;

      for (let i = 1; i < parts.length; i++) {
        folders.add(parts.slice(0, i).join("/"));
      }
    }

    for (const folder of folders) {
      if (!slugs.has(folder)) {
        errors.push(
          `${groupKey}: folder "${folder}" is missing required landing page "${folder}.mdx"`,
        );
      }
    }
  }
}

export function collectDocsContent(contentRoot: string): DocsContentValidationResult {
  const errors: string[] = [];
  const files = findMdxFiles(contentRoot);
  const parsedFiles: ParsedContentFile[] = [];

  for (const absolutePath of files) {
    const parsedPath = parseDocsPath(absolutePath, contentRoot, errors);
    if (!parsedPath) continue;

    const raw = fs.readFileSync(absolutePath, "utf-8");
    const frontmatter = normalizeFrontmatter(absolutePath, raw, errors);
    const contentRelativePath = path.relative(contentRoot, absolutePath).replace(/\\/g, "/");
    const virtualPath = `/content/docs/${contentRelativePath}`;

    parsedFiles.push({
      ...parsedPath,
      frontmatter,
      raw,
      virtualPath,
    });
  }

  validateLandingPages(parsedFiles, errors);

  const rawByPath: Record<string, string> = {};
  const frontmatterByPath: Record<string, DocsFrontmatter> = {};

  for (const file of parsedFiles) {
    rawByPath[file.virtualPath] = file.raw;
    frontmatterByPath[file.virtualPath] = file.frontmatter;
  }

  return {
    errors,
    rawByPath,
    frontmatterByPath,
  };
}

export function assertDocsContentValid(contentRoot: string): void {
  const result = collectDocsContent(contentRoot);
  if (result.errors.length === 0) return;

  const details = result.errors.map((e) => ` - ${e}`).join("\n");
  throw new Error(`[docs-content] Validation failed:\n${details}`);
}
