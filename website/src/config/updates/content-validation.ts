import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { UPDATES_CONFIG } from "./index";
import { findMdxFiles, isValidIconExport } from "../shared/content-validation-utils";
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

const ALLOWED_TAGS = new Set<UpdatesTag>(["release-candidate", "beta", "release"]);

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
    errors.push(`${filePath}: frontmatter "tag" must be one of release-candidate | beta | release`);
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
      : "release-candidate") as UpdatesTag,
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
