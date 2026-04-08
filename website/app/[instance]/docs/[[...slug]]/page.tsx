import fs from 'node:fs/promises';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { compileMDX } from 'next-mdx-remote/rsc';
import { remarkHeadingId } from 'remark-custom-heading-id';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import remarkFlexibleCodeTitles from 'remark-flexible-code-titles';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkDirective from 'remark-directive';
import remarkAdmonitionDirectives from '@/lib/remark-admonition-directives';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { DocsOnThisPage } from '@/components/ui/on-this-page';
import { useMDXComponents as getMDXComponents } from '@/mdx-components';
import {
  extractTocHeadings,
  getDocsBreadcrumbs,
  getDocsDocFrontmatter,
  getAllDocsDocSlugs,
  resolveDocsDocFilePath,
  type DocsFrontmatter,
} from '@/lib/docs/server';
import { DOCS_INSTANCES } from '@/config/content/docs';
import { InstanceDocsHubPage } from '@/features/docs/components/instance-docs-hub-page';
import { resolveEmbedDescription } from '@/config/site/embed-descriptions';
import { buildEmbedMetadata } from '@/config/site/metadata';
import {
  buildDocsHubHref,
  buildDocHref,
  resolveDocsRouteForInstance,
} from '@/lib/docs/shared';

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getAllDocsDocSlugs();

  const paramKeys = new Set<string>();

  for (const instance of DOCS_INSTANCES) {
    paramKeys.add(`${instance.id}::`);

    if (!instance.versioned) {
      const instanceSlugs = slugs
        .filter((parts) => parts[0] === instance.id)
        .map((parts) => parts.slice(1).join('/'));

      instanceSlugs.forEach((value) =>
        paramKeys.add(`${instance.id}::${value}`),
      );
      continue;
    }

    for (const version of instance.versions ?? []) {
      paramKeys.add(`${instance.id}::${version.value}`);
      paramKeys.add(`${instance.id}::latest`);
    }

    const instanceSlugs = slugs
      .filter((parts) => parts[0] === instance.id)
      .map((parts) => parts.slice(1).join('/'));

    instanceSlugs.forEach((value) => paramKeys.add(`${instance.id}::${value}`));

    const latestAlias = slugs
      .filter(
        (parts) =>
          parts[0] === instance.id &&
          parts[1] &&
          instance.versions?.some((version) => version.value === parts[1]),
      )
      .map((parts) => ['latest', ...parts.slice(2)].join('/'));

    latestAlias.forEach((value) => paramKeys.add(`${instance.id}::${value}`));
  }

  return Array.from(paramKeys).map((entry) => {
    const [instance, key] = entry.split('::');
    return {
      instance,
      slug: key ? key.split('/') : [''],
    };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ instance: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { instance: instanceId, slug } = await params;
  const normalizedSlug = slug?.filter(Boolean);
  const resolved = resolveDocsRouteForInstance(instanceId, normalizedSlug);

  if (!resolved) {
    return buildEmbedMetadata({
      title: 'Docs',
      description: 'Documentation for Subway Builder Modded projects.',
    });
  }

  if (!normalizedSlug?.length) {
    const title = `Docs | ${resolved.instance.label}`;
    const description = resolveEmbedDescription(
      buildDocsHubHref(resolved.instance),
      resolved.instance.hub.description,
    );
    return buildEmbedMetadata({ title, description });
  }

  if (!resolved.docSlug) {
    const title = `Docs | ${resolved.instance.label}`;
    const description = resolveEmbedDescription(
      buildDocsHubHref(resolved.instance),
      resolved.instance.hub.description,
    );
    return buildEmbedMetadata({ title, description });
  }

  const frontmatter = await getDocsDocFrontmatter([
    instanceId,
    ...normalizedSlug,
  ]);
  const title = frontmatter?.title;
  const routePath = buildDocHref(
    resolved.instance,
    resolved.version,
    resolved.docSlug,
  );
  const baseDescription =
    frontmatter?.description?.trim() || resolved.instance.hub.description;
  const metadataTitle = title
    ? `${title} | ${resolved.instance.label}`
    : `Docs | ${resolved.instance.label}`;
  const description = resolveEmbedDescription(routePath, baseDescription);

  return buildEmbedMetadata({
    title: metadataTitle,
    description,
  });
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ instance: string; slug?: string[] }>;
}) {
  const { instance: instanceId, slug } = await params;
  const normalizedSlug = slug?.filter(Boolean);

  const resolved = resolveDocsRouteForInstance(instanceId, normalizedSlug);
  if (!resolved) notFound();

  if (!normalizedSlug?.length) {
    return <InstanceDocsHubPage instance={resolved.instance} />;
  }

  if (resolved.instance.versioned && resolved.requestedVersion === 'latest') {
    if (resolved.docSlug) {
      redirect(
        buildDocHref(resolved.instance, resolved.version, resolved.docSlug),
      );
    }

    redirect(buildDocsHubHref(resolved.instance));
  }

  if (!resolved.docSlug) {
    redirect(buildDocsHubHref(resolved.instance));
  }

  const filePath = await resolveDocsDocFilePath([
    instanceId,
    ...(normalizedSlug ?? []),
  ]);
  if (!filePath) notFound();

  const source = await fs.readFile(filePath, 'utf8');
  const breadcrumbs = await getDocsBreadcrumbs([
    instanceId,
    ...(normalizedSlug ?? []),
  ]);
  const toc = await extractTocHeadings(filePath);

  const { content, frontmatter } = await compileMDX<DocsFrontmatter>({
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
            {
              target: '_blank',
              rel: ['nofollow', 'noopener', 'noreferrer'],
            },
          ],
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'append',
              properties: {
                className: ['heading-anchor'],
                ariaLabel: 'Link to section',
              },
              content: {
                type: 'text',
                value: '#',
              },
            },
          ],
        ],
      },
    },
    components: getMDXComponents(),
  });

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-14 2xl:gap-20">
      <article className="min-w-0 flex-1">
        <Breadcrumb className="mb-5">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <BreadcrumbItem key={`${crumb.label}-${index}`}>
                  {isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href ?? '#'}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                  {!isLast ? <BreadcrumbSeparator /> : null}
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>

        {frontmatter?.title ? (
          <header className="mb-8">
            <h1 className="text-4xl font-black tracking-tight">
              {frontmatter.title}
            </h1>
          </header>
        ) : null}

        <div className="max-w-none space-y-1">{content}</div>
      </article>

      <aside className="hidden xl:block">
        <div className="sticky top-20 max-h-[calc(100svh-5rem)] overflow-y-auto">
          <DocsOnThisPage headings={toc} />
        </div>
      </aside>
    </div>
  );
}
