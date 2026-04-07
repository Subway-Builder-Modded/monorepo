import fs from 'node:fs/promises';
import path from 'node:path';
import type { Metadata } from 'next';
import { compileMDX } from 'next-mdx-remote/rsc';
import { Scale } from 'lucide-react';
import remarkGfm from 'remark-gfm';

import { PageHeader } from '@/components/shared/page-header';
import { ThemedShowcaseCard } from '@/components/ui/themed-showcase-card';
import { buildEmbedMetadata } from '@/config/site/metadata';
import { SHARED_TEXT_COLOR } from '@/config/theme/colors';
import { hexAlpha } from '@/lib/color';
import { useMDXComponents as getMDXComponents } from '@/mdx-components';

type LicenseFrontmatter = {
  title?: string;
  description?: string;
};

const LICENSE_MDX_PATH = path.join(
  process.cwd(),
  'content',
  'license',
  'gpl-3.0.mdx',
);
const NEUTRAL_ACCENT = SHARED_TEXT_COLOR;

export const metadata: Metadata = buildEmbedMetadata({
  title: 'License',
  description:
    'Terms and licensing information for Subway Builder Modded projects.',
});

export default async function LicensePage() {
  const source = await fs.readFile(LICENSE_MDX_PATH, 'utf8');

  const { content, frontmatter } = await compileMDX<LicenseFrontmatter>({
    source,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
    components: getMDXComponents(),
  });

  const title = frontmatter?.title ?? 'GNU General Public License v3.0';
  const description = frontmatter?.description;

  return (
    <section className="relative px-5 pb-12 pt-8 sm:px-8 sm:pt-10">
      <div className="w-full">
        <PageHeader
          icon={Scale}
          title="License"
          description="Terms and licensing information for Subway Builder Modded projects."
        />

        <ThemedShowcaseCard
          variant="header"
          palette={{
            accent: NEUTRAL_ACCENT,
            primary: {
              light: hexAlpha(NEUTRAL_ACCENT.light, 0.14),
              dark: hexAlpha(NEUTRAL_ACCENT.dark, 0.18),
            },
          }}
          className="relative mb-8 w-full"
        >
          <div className="relative">
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </ThemedShowcaseCard>

        <article className="prose prose-zinc prose-code:before:content-none prose-code:after:content-none max-w-none rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm dark:prose-invert sm:p-7">
          {content}
        </article>
      </div>
    </section>
  );
}
