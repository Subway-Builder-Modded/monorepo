import fs from 'node:fs/promises';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { compileMDX } from 'next-mdx-remote/rsc';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import rehypePrettyCode from 'rehype-pretty-code';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import remarkDirective from 'remark-directive';
import remarkFlexibleCodeTitles from 'remark-flexible-code-titles';
import remarkGfm from 'remark-gfm';
import { remarkHeadingId } from 'remark-custom-heading-id';

import { HomeLinkButton } from '@/features/home/components/home-link-button';
import { ReleaseTagBadge } from '@/features/updates/components/release-tag-badge';
import { UpdateSection } from '@/features/updates/components/update-section';
import { ThemedShowcaseCard } from '@/components/ui/themed-showcase-card';
import { getUpdateProjectById } from '@/config/content/updates';
import { resolveEmbedDescription } from '@/config/site/embed-descriptions';
import { buildEmbedMetadata } from '@/config/site/metadata';
import { useMDXComponents as getMDXComponents } from '@/mdx-components';
import remarkAdmonitionDirectives from '@/lib/remark-admonition-directives';
import {
  getAllUpdateParams,
  getUpdateFilePath,
  readUpdateFrontmatter,
  type UpdateFrontmatter,
} from '@/lib/updates.server';

export const dynamicParams = false;

export async function generateStaticParams() {
  const params = await getAllUpdateParams();
  return params.map((entry) => ({
    instance: entry.project,
    version: entry.version,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ instance: string; version: string }>;
}): Promise<Metadata> {
  const { instance: projectId, version } = await params;
  const project = getUpdateProjectById(projectId);
  if (!project) {
    return buildEmbedMetadata({
      title: 'Updates',
      description:
        'Changelogs and release notes for Subway Builder Modded projects.',
    });
  }

  const filePath = getUpdateFilePath(projectId, version);
  if (!filePath) {
    return buildEmbedMetadata({
      title: `Updates | ${project.label}`,
      description: `Changelogs and release notes for ${project.label} ${version}.`,
    });
  }

  const frontmatter = await readUpdateFrontmatter(filePath);
  const title = `${version} Changelog`;
  const baseDescription =
    frontmatter?.description?.trim() ||
    `Changelogs and release notes for ${project.label} ${title}.`;
  const routePath = `/${project.id}/updates/${version}`;
  const description = resolveEmbedDescription(routePath, baseDescription);

  return buildEmbedMetadata({
    title: `${title} | ${project.label}`,
    description,
  });
}

export default async function UpdatePage({
  params,
}: {
  params: Promise<{ instance: string; version: string }>;
}) {
  const { instance: projectId, version } = await params;
  const project = getUpdateProjectById(projectId);
  if (!project) notFound();

  const filePath = getUpdateFilePath(projectId, version);
  if (!filePath) notFound();

  const source = await fs.readFile(filePath, 'utf8');
  const { content, frontmatter } = await compileMDX<UpdateFrontmatter>({
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
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'append',
              properties: {
                className: ['heading-anchor'],
                ariaLabel: 'Link to section',
              },
              content: { type: 'text', value: '#' },
            },
          ],
        ],
      },
    },
    components: getMDXComponents({
      UpdateSection: (props) => (
        <UpdateSection {...props} themeId={project.id} />
      ),
    }),
  });

  const title = frontmatter?.title ?? `${project.label} ${version}`;
  const date = frontmatter?.date;
  const tag = frontmatter?.tag ?? 'release';
  const githubUrl = frontmatter?.githubUrl;

  return (
    <section className="relative px-5 pb-12 pt-8 sm:px-8 sm:pt-10">
      <div className="w-full">
        <ThemedShowcaseCard
          variant="header"
          palette={{ accent: project.accentColor }}
          className="mx-auto mb-8 max-w-4xl"
        >
          <div className="relative">
            <div className="mb-4">
              <HomeLinkButton
                link={{
                  label: 'Back',
                  href: `/${project.id}/updates`,
                  icon: ArrowLeft,
                  variant: 'outline',
                  size: 'sm',
                }}
              />
            </div>

            {githubUrl ? (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-2xl font-black tracking-tight text-foreground transition-colors hover:text-primary sm:text-3xl"
              >
                <span>{title}</span>
                <ExternalLink className="size-5 opacity-65 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            ) : (
              <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                {title}
              </h2>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {date ? (
                <p className="text-sm text-muted-foreground">{date}</p>
              ) : null}
              {
                {
                  release: <ReleaseTagBadge kind="release" size="sm" />,
                  beta: <ReleaseTagBadge kind="beta" size="sm" />,
                  alpha: <ReleaseTagBadge kind="alpha" size="sm" />,
                }[tag]
              }
            </div>
          </div>
        </ThemedShowcaseCard>

        <article className="prose prose-zinc prose-code:before:content-none prose-code:after:content-none mx-auto max-w-4xl rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm dark:prose-invert sm:p-7">
          {content}
        </article>
      </div>
    </section>
  );
}
