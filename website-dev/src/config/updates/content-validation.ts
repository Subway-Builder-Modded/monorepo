import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import * as icons from "lucide-react";
import { UPDATES_CONFIG } from "./index";
import { CUSTOM_ICON_NAMES } from "@subway-builder-modded/icons";
import type { UpdatesFrontmatter, UpdatesSuiteId, UpdatesTag } from "./types";

type ParsedUpdatesFile = {
  absolutePath: string;
  virtualPath: string;
  suiteId: UpdatesSuiteId;
  id: string;
  frontmatter: UpdatesFrontmatter;
  raw: string;
};

type UpdatesContentValidationResult = {
  errors: string[];
  rawByPath: Record<string, string>;
  frontmatterByPath: Record<string, UpdatesFrontmatter>;
};

const ALLOWED_TAGS = new Set<UpdatesTag>(["alpha", "beta", "release"]);

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
  if (CUSTOM_ICON_NAMES.has(name)) return true;

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

function normalizeFrontmatter(filePath: string, raw: string, errors: string[]): UpdatesFrontmatter {
  const parsed = matter(raw).data as Record<string, unknown>;

  const title = parsed.title;
  const icon = parsed.icon;
  const date = parsed.date;
  const tag = parsed.tag;
  const url = parsed.url;
  const previousVersion = parsed.previousVersion;
  const compareUrl = parsed.compareUrl;

  if (typeof title !== "string" || !title.trim()) {
    errors.push(`${filePath}: missing required frontmatter field "title"`);
  }

  if ("description" in parsed) {
    errors.push(`${filePath}: frontmatter field "description" is not allowed for updates`);
  }

  if (typeof icon !== "string" || !icon.trim()) {
    errors.push(`${filePath}: missing required frontmatter field "icon"`);
  } else if (!isValidIconExport(icon)) {
    errors.push(`${filePath}: invalid icon "${icon}" (must match a lucide-react export)`);
  }

  const normalizedDate =
    typeof date === "string" ? date : date instanceof Date ? date.toISOString().slice(0, 10) : "";

  if (!normalizedDate.trim()) {
    errors.push(`${filePath}: missing required frontmatter field "date"`);
  }

  if (typeof tag !== "string" || !ALLOWED_TAGS.has(tag as UpdatesTag)) {
    errors.push(`${filePath}: frontmatter "tag" must be one of alpha | beta | release`);
  }

  const hasPreviousVersion =
    typeof previousVersion === "string" && previousVersion.trim().length > 0;
  const hasCompareUrl = typeof compareUrl === "string" && compareUrl.trim().length > 0;

  if (hasPreviousVersion !== hasCompareUrl) {
    errors.push(
      `${filePath}: frontmatter fields "previousVersion" and "compareUrl" must both be provided or both be omitted`,
    );
  }

  if (
    compareUrl !== undefined &&
    (typeof compareUrl !== "string" || !/^https?:\/\//i.test(compareUrl))
  ) {
    errors.push(`${filePath}: frontmatter "compareUrl" must be an absolute http(s) URL`);
  }

  return {
    title: typeof title === "string" ? title : "",
    icon: typeof icon === "string" ? icon : "",
    date: normalizedDate,
    tag: (typeof tag === "string" && ALLOWED_TAGS.has(tag as UpdatesTag)
      ? tag
      : "alpha") as UpdatesTag,
    url: typeof url === "string" && url.trim() ? url.trim() : undefined,
    previousVersion: hasPreviousVersion ? previousVersion.trim() : undefined,
    compareUrl: hasCompareUrl ? compareUrl.trim() : undefined,
  };
}

function parseUpdatesPath(
  absolutePath: string,
  contentRoot: string,
  errors: string[],
): Omit<ParsedUpdatesFile, "frontmatter" | "raw" | "virtualPath"> | null {
  const relativePath = path.relative(contentRoot, absolutePath).replace(/\\/g, "/");
  const withoutExt = relativePath.replace(/\.mdx$/, "");
  const segments = withoutExt.split("/");

  if (segments.length < 3 || segments[1] !== "updates") {
    return null;
  }

  const suiteCandidate = segments[0];
  if (!(suiteCandidate in UPDATES_CONFIG.suites)) {
    return null;
  }

  const suiteId = suiteCandidate as UpdatesSuiteId;
  const id = segments.slice(2).join("/");

  if (!id.trim()) {
    errors.push(`${absolutePath}: updates file must be /<suite>/updates/<slug>.mdx`);
    return null;
  }

  return {
    absolutePath,
    suiteId,
    id,
  };
}

export function collectUpdatesContent(contentRoot: string): UpdatesContentValidationResult {
  const errors: string[] = [];
  const files = findMdxFiles(contentRoot);
  const parsedFiles: ParsedUpdatesFile[] = [];

  for (const absolutePath of files) {
    const parsedPath = parseUpdatesPath(absolutePath, contentRoot, errors);
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

  const rawByPath: Record<string, string> = {};
  const frontmatterByPath: Record<string, UpdatesFrontmatter> = {};

  for (const file of parsedFiles) {
    rawByPath[file.virtualPath] = file.raw;
    frontmatterByPath[file.virtualPath] = file.frontmatter;
  }

  // Folder invariant: every nested updates folder must have a landing page
  // at the same slug (e.g. `v1.2.0/rc/alpha.mdx` requires `v1.2.0/rc.mdx`).
  const idsBySuite = new Map<UpdatesSuiteId, Set<string>>();
  for (const file of parsedFiles) {
    const ids = idsBySuite.get(file.suiteId) ?? new Set<string>();
    ids.add(file.id);
    idsBySuite.set(file.suiteId, ids);
  }

  for (const [suiteId, ids] of idsBySuite.entries()) {
    for (const id of ids) {
      const parts = id.split("/");
      if (parts.length <= 1) continue;

      for (let i = 1; i < parts.length; i++) {
        const folder = parts.slice(0, i).join("/");
        if (!ids.has(folder)) {
          errors.push(
            `${suiteId}/updates/${folder}: missing folder landing page "${folder}.mdx" for nested updates content`,
          );
        }
      }
    }
  }

  return {
    errors,
    rawByPath,
    frontmatterByPath,
  };
}

export function assertUpdatesContentValid(contentRoot: string): void {
  const result = collectUpdatesContent(contentRoot);
  if (result.errors.length === 0) return;

  const details = result.errors.map((e) => ` - ${e}`).join("\n");
  throw new Error(`[updates-content] Validation failed:\n${details}`);
}
