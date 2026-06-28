import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { DOCS_CONFIG } from "./index";
import { findMdxFiles, isValidIconExport } from "../shared/content-validation-utils";
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

  if (segments.length < 3 || segments[1] !== "docs") {
    return null;
  }

  const suiteCandidate = segments[0];
  if (!(suiteCandidate in DOCS_CONFIG.suites)) {
    return null;
  }

  const suiteId = suiteCandidate as DocsSuiteId;
  const suite = DOCS_CONFIG.suites[suiteId];

  const suiteSegments = segments.slice(2);
  if (suiteSegments.length < 1) {
    errors.push(`${absolutePath}: docs file must include a slug after /<suite>/docs`);
    return null;
  }

  if (suite.versioned) {
    if (suiteSegments.length < 2) {
      errors.push(
        `${absolutePath}: versioned suite "${suiteId}" requires /<suite>/docs/<version>/<slug>.mdx`,
      );
      return null;
    }

    const version = suiteSegments[0];
    if (!suite.versions.some((v) => v.value === version)) {
      errors.push(`${absolutePath}: unknown version "${version}" for suite "${suiteId}"`);
      return null;
    }

    const slug = suiteSegments.slice(1).join("/");
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

  if (suiteSegments.length >= 2 && VERSION_PATTERN.test(suiteSegments[0])) {
    errors.push(
      `${absolutePath}: non-versioned suite "${suiteId}" must not use version folder "${suiteSegments[0]}"`,
    );
    return null;
  }

  const slug = suiteSegments.join("/");
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
    const virtualPath = `/content/${contentRelativePath}`;

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
