import type { UpdatesFrontmatter, UpdatesSuiteId } from "@/config/updates";
import { getUpdatesSuiteConfig } from "@/config/updates";
import type { UpdateEntry, UpdateTreeNode } from "./types";
import { constructEditUrl } from "@/features/content/lib/edit-url";
import type {
  RawMdxModule,
  MdxGlobResult,
  MdxRawContentModule,
} from "@/features/content/lib/mdx-virtual-module";
// @ts-expect-error - virtual module provided by vite plugin
import rawContentData from "virtual:mdx-raw-content";

const mdxModules = import.meta.glob("/content/*/updates/**/*.mdx") as MdxGlobResult;
const mdxRawModules: Record<string, string> = (
  rawContentData as MdxRawContentModule<UpdatesFrontmatter>
).rawByPath;
const mdxFrontmatterModules: Record<string, UpdatesFrontmatter> = (
  rawContentData as MdxRawContentModule<UpdatesFrontmatter>
).frontmatterByPath;

const SEMVER_ID_REGEX = /^v?(\d+)\.(\d+)\.(\d+)$/;

function compareSemverIdsDesc(a: string, b: string): number {
  const aMatch = a.match(SEMVER_ID_REGEX);
  const bMatch = b.match(SEMVER_ID_REGEX);

  if (!aMatch && !bMatch) return 0;
  if (!aMatch) return 1;
  if (!bMatch) return -1;

  for (let i = 1; i <= 3; i++) {
    const diff = Number(bMatch[i]) - Number(aMatch[i]);
    if (diff !== 0) return diff;
  }

  return 0;
}

function getEntryForPath(
  pathName: string,
  loader: () => Promise<RawMdxModule>,
): UpdateEntry | null {
  const match = pathName.match(/^\/content\/([^/]+)\/updates\/(.+)\.mdx$/);
  if (!match) return null;

  const suiteId = match[1] as UpdatesSuiteId;
  const id = match[2];
  const frontmatter = mdxFrontmatterModules[pathName] as UpdatesFrontmatter | undefined;
  const raw = mdxRawModules[pathName];

  if (!frontmatter || !raw) {
    return null;
  }

  return {
    key: id.split("/").slice(-1)[0] ?? id,
    id,
    suiteId,
    depth: id.split("/").length - 1,
    sourcePath: pathName,
    routePath: `/${suiteId}/updates/${id}`,
    frontmatter,
    loader,
    raw,
  };
}

let entriesCache: UpdateEntry[] | null = null;

function discoverEntries(): UpdateEntry[] {
  const entries: UpdateEntry[] = [];

  for (const [pathName, loader] of Object.entries(mdxModules)) {
    const parsed = getEntryForPath(pathName, loader);
    if (parsed) {
      entries.push(parsed);
    }
  }

  return entries;
}

function getEntries(): UpdateEntry[] {
  if (!entriesCache) {
    entriesCache = discoverEntries();
  }

  return entriesCache;
}

/**
 * Sort rule: newest first by semantic version id when parsable (vX.Y.Z).
 * If semver comparison ties, fall back to descending ISO date text, then id.
 */
function sortEntries(entries: UpdateEntry[]): UpdateEntry[] {
  return [...entries].sort((a, b) => {
    const semverOrder = compareSemverIdsDesc(a.id, b.id);
    if (semverOrder !== 0) {
      return semverOrder;
    }

    const dateOrder = b.frontmatter.date.localeCompare(a.frontmatter.date);
    if (dateOrder !== 0) {
      return dateOrder;
    }

    return b.id.localeCompare(a.id);
  });
}

export function getUpdatesEntries(suiteId: UpdatesSuiteId): UpdateEntry[] {
  const suite = getUpdatesSuiteConfig(suiteId);
  if (!suite) return [];

  return sortEntries(
    getEntries().filter((entry) => entry.suiteId === suiteId && !entry.id.includes("/")),
  );
}

export function findUpdateEntry(suiteId: UpdatesSuiteId, id: string): UpdateEntry | null {
  const suite = getUpdatesSuiteConfig(suiteId);
  if (!suite) return null;

  return getEntries().find((entry) => entry.suiteId === suiteId && entry.id === id) ?? null;
}

export function getUpdateDirectoryEntries(
  suiteId: UpdatesSuiteId,
  folderPath: string,
): UpdateTreeNode[] {
  const suite = getUpdatesSuiteConfig(suiteId);
  if (!suite) return [];

  const normalizedFolder = folderPath.replace(/^\/+|\/+$/g, "");
  const prefix = normalizedFolder ? `${normalizedFolder}/` : "";
  const entries = getEntries().filter((entry) => {
    if (entry.suiteId !== suiteId) return false;
    if (entry.id === normalizedFolder) return false;
    if (!entry.id.startsWith(prefix)) return false;

    const remainder = entry.id.slice(prefix.length);
    if (!remainder) return false;
    return !remainder.includes("/");
  });

  return sortEntries(entries).map((entry) => ({
    key: entry.key,
    id: entry.id,
    suiteId: entry.suiteId,
    depth: entry.depth,
    sourcePath: entry.sourcePath,
    routePath: entry.routePath,
    frontmatter: entry.frontmatter,
  }));
}

export async function loadUpdateContent(sourcePath: string): Promise<React.ComponentType | null> {
  const loader = mdxModules[sourcePath];
  if (!loader) return null;

  const mod = await loader();
  return mod.default;
}

export function getUpdateRawContent(sourcePath: string): string | null {
  return mdxRawModules[sourcePath] ?? null;
}

export function getUpdateSourcePath(suiteId: UpdatesSuiteId, id: string): string {
  return `/content/${suiteId}/updates/${id}.mdx`;
}

export function getUpdateEditUrl(suiteId: UpdatesSuiteId, id: string): string {
  const config = getUpdatesSuiteConfig(suiteId);
  if (!config) return "#";
  return constructEditUrl(config.editSourceBaseUrl, id);
}
