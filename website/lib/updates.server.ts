import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { remarkHeadingId } from 'remark-custom-heading-id';
import remarkFlexibleCodeTitles from 'remark-flexible-code-titles';
import remarkDirective from 'remark-directive';
import remarkAdmonitionDirectives from '@/lib/remark-admonition-directives';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

import { UPDATE_PROJECTS, type UpdateTag } from '@/config/content/updates';

const UPDATES_ROOT = path.join(process.cwd(), 'content', 'updates');

export type UpdateFrontmatter = {
  title: string;
  date: string;
  tag: UpdateTag;
  githubUrl?: string;
  description?: string;
};

export type UpdateMeta = {
  projectId: string;
  version: string;
  title: string;
  date: string;
  tag: UpdateTag;
  githubUrl?: string;
  href: string;
};

function exists(p: string) {
  return fs.existsSync(p);
}

async function readFrontmatter(
  filePath: string,
): Promise<UpdateFrontmatter | undefined> {
  try {
    const source = await fs.promises.readFile(filePath, 'utf8');
    const { frontmatter } = await compileMDX<UpdateFrontmatter>({
      source,
      options: {
        parseFrontmatter: true,
        mdxOptions: {
          remarkPlugins: [
            remarkGfm,
            remarkHeadingId,
            remarkFlexibleCodeTitles,
            remarkDirective,
            remarkAdmonitionDirectives,
          ],
          rehypePlugins: [
            [
              rehypePrettyCode,
              {
                theme: {
                  dark: 'github-dark',
                  light: 'github-light-high-contrast',
                },
                keepBackground: false,
              },
            ],
            [
              rehypeExternalLinks,
              { target: '_blank', rel: ['nofollow', 'noopener', 'noreferrer'] },
            ],
            [rehypeAutolinkHeadings, { behavior: 'append' }],
          ],
        },
      },
    });
    return frontmatter;
  } catch {
    return undefined;
  }
}

/**
 * Parse a semantic version string like "v1.0.0" or "1.2.3" into a
 * tuple of numbers for sorting. Falls back to [0, 0, 0] on failure.
 */
function parseSemver(version: string): [number, number, number] {
  const cleaned = version.replace(/^v/, '');
  const parts = cleaned.split('.').map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function compareSemver(a: string, b: string): number {
  const [aMaj, aMin, aPat] = parseSemver(a);
  const [bMaj, bMin, bPat] = parseSemver(b);
  if (aMaj !== bMaj) return aMaj - bMaj;
  if (aMin !== bMin) return aMin - bMin;
  return aPat - bPat;
}

/**
 * Returns all update versions for a project, sorted newest → oldest.
 * The first item is the latest release.
 */
export async function getAllUpdatesForProject(
  projectId: string,
): Promise<UpdateMeta[]> {
  const dir = path.join(UPDATES_ROOT, projectId);
  if (!exists(dir)) return [];

  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const mdxFiles = entries.filter((e) => e.isFile() && e.name.endsWith('.mdx'));

  const metas: UpdateMeta[] = [];

  for (const file of mdxFiles) {
    const version = file.name.replace(/\.mdx$/, '');
    const filePath = path.join(dir, file.name);
    const frontmatter = await readFrontmatter(filePath);

    metas.push({
      projectId,
      version,
      title: frontmatter?.title ?? `${projectId} ${version}`,
      date: frontmatter?.date ?? '',
      tag: frontmatter?.tag ?? 'release',
      githubUrl: frontmatter?.githubUrl,
      href: `/${projectId}/updates/${version}`,
    });
  }

  // Sort newest → oldest
  return metas.sort((a, b) => compareSemver(b.version, a.version));
}

/**
 * Returns the absolute file path for a given project + version,
 * or null if it doesn't exist.
 */
export function getUpdateFilePath(
  projectId: string,
  version: string,
): string | null {
  const filePath = path.join(UPDATES_ROOT, projectId, `${version}.mdx`);
  return exists(filePath) ? filePath : null;
}

/**
 * Generates all valid [project, version] param pairs for static export.
 */
export async function getAllUpdateParams(): Promise<
  { project: string; version: string }[]
> {
  const params: { project: string; version: string }[] = [];

  for (const project of UPDATE_PROJECTS) {
    const updates = await getAllUpdatesForProject(project.id);
    for (const update of updates) {
      params.push({ project: project.id, version: update.version });
    }
  }

  return params;
}

export { readFrontmatter as readUpdateFrontmatter };
