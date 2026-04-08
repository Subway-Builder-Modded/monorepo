'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BookText,
  Bug,
  FileCode2,
  GitPullRequestArrow,
  Package,
  Rocket,
  Sparkles,
  TerminalSquare,
  Wrench,
  Tag,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { createHighlighter } from 'shiki';

import { HomeLinkButton } from '@/features/home/components/home-link-button';
import { MarkdownText } from '@/components/ui/markdown-text';
import type { HomeButtonSize } from '@/config/site/homepage';
import {
  LANDING_HERO_COPY,
  interpolateHeroText,
  type HeroActionId,
} from '@/config/content/landing-hero';
import { getUpdateProjectById } from '@/config/content/updates';
import { LineBullet } from '@/components/ui/line-bullet';
import { cn } from '@/lib/utils';

type HeroAction = {
  id: HeroActionId;
  labelMd: string;
  href: string;
  icon: LucideIcon;
  variant: 'solid' | 'outline';
  size: HomeButtonSize;
  external?: boolean;
};

type Track = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  command: string;
  commandLanguage: 'bash' | 'sh';
  file: string;
  snippet: string;
  snippetLanguage: 'ts' | 'tsx' | 'json' | 'sh';
  tags: string[];
};

type Capability = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const HERO_ACTION_ICONS: Record<HeroActionId, LucideIcon> = {
  'template-mod-get-started': GitPullRequestArrow,
  'template-mod-docs': BookText,
};

const TRACKS: Track[] = [
  {
    id: 'bootstrap',
    title: 'Install and Configure',
    description:
      'Install with pnpm, then set your mod metadata before first run.',
    icon: Rocket,
    command: 'pnpm install\npnpm typecheck',
    commandLanguage: 'bash',
    file: 'manifest.json',
    snippet:
      '{\n  "id": "com.yourname.yourmod",\n  "name": "Your Mod Name",\n  "description": "What it does",\n  "version": "1.0.0",\n  "author": { "name": "Your Name" },\n  "main": "index.js"\n}',
    snippetLanguage: 'json',
    tags: ['API v1.0.0 target', 'pnpm workflow', 'Manifest-first setup'],
  },
  {
    id: 'iterate',
    title: 'Build, Link, and Develop',
    description:
      'Build once, symlink to the game mods folder, then iterate with watch mode + game logging.',
    icon: Wrench,
    command: 'pnpm build\npnpm dev:link\npnpm dev',
    commandLanguage: 'bash',
    file: 'debug/latest.log',
    snippet:
      '# dev starts watcher + game in parallel.\n# Logs are written here:\ndebug/latest.log\n\n# In-game hot reload:\n# Windows/Linux: CTRL + SHIFT + R\n# macOS: CMD + SHIFT + R',
    snippetLanguage: 'sh',
    tags: ['Hot reload loop', 'Symlink helper', 'Live game logs'],
  },
  {
    id: 'stabilize',
    title: 'Game API',
    description:
      'Wire hooks, game actions, and runtime React/UI components through `window.SubwayBuilderAPI`.',
    icon: Bug,
    command: 'pnpm build\npnpm dev:unlink',
    commandLanguage: 'bash',
    file: 'src/main.ts',
    snippet:
      'const api = window.SubwayBuilderAPI\n\napi.hooks.onMapReady((map) => {\n  api.ui.showNotification("Map loaded", "info")\n})\n\napi.ui.addFloatingPanel({\n  id: "my-panel",\n  title: "My Panel",\n  icon: "Settings",\n  render: MyComponent,\n})',
    snippetLanguage: 'ts',
    tags: ['Hooks + actions', 'Runtime UI components', 'Typed API surface'],
  },
];

const CAPABILITIES: Capability[] = [
  {
    id: 'types',
    title: 'Modding API-Aligned Types',
    description:
      'Template typings are aligned to Modding API v1.0.0, including core, game-state, build, and UI modules.',
    icon: FileCode2,
  },
  {
    id: 'component',
    title: 'React at Runtime',
    description:
      'React is provided by the game. Use regular hooks and bind game UI components from SubwayBuilderAPI.',
    icon: Sparkles,
  },
  {
    id: 'runtime',
    title: 'Dev Scripts',
    description:
      'Use `build`/`dev`/`dev:link`/`dev:unlink`/`typecheck` scripts for a stable modding workflow across platforms.',
    icon: TerminalSquare,
  },
];

function SectionShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="relative z-10 px-[clamp(1.5rem,5vw,4rem)]">
      <div className="w-full rounded-2xl border border-border/80 bg-background/88 px-[clamp(1.25rem,4vw,2.5rem)] py-20 shadow-sm backdrop-blur-md">
        <div className="w-full">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            <div className="h-px flex-1 bg-border" />
          </div>
          {description ? (
            <p className="mt-4 w-full text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </section>
  );
}

function SectionDivider() {
  return (
    <div
      className="relative z-10 px-[clamp(1.5rem,5vw,4rem)] py-10"
      aria-hidden="true"
    >
      <div className="w-full">
        <div className="h-px bg-border/80" />
      </div>
    </div>
  );
}

export default function TemplateModPage() {
  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [-240, 0, 900], [1, 1, 1.3]);
  const heroY = useTransform(scrollY, [-240, 0, 900], [0, 0, -130]);
  const { resolvedTheme } = useTheme();
  const [activeTrackId, setActiveTrackId] = useState(TRACKS[0].id);
  const [activeCapabilityId, setActiveCapabilityId] = useState(
    CAPABILITIES[0].id,
  );
  const [highlightedBlocks, setHighlightedBlocks] = useState<
    Record<string, { commandHtml: string; snippetHtml: string }>
  >({});

  const activeTrack = useMemo(
    () => TRACKS.find((track) => track.id === activeTrackId) ?? TRACKS[0],
    [activeTrackId],
  );
  const activeTrackHtml = highlightedBlocks[activeTrack.id];

  useEffect(() => {
    let mounted = true;

    async function buildHighlightedBlocks() {
      const highlighter = await createHighlighter({
        themes: ['github-light-high-contrast', 'github-dark'],
        langs: ['bash', 'sh', 'ts', 'tsx', 'json'],
      });
      const theme =
        resolvedTheme === 'dark' ? 'github-dark' : 'github-light-high-contrast';

      const output: Record<
        string,
        { commandHtml: string; snippetHtml: string }
      > = {};

      for (const track of TRACKS) {
        output[track.id] = {
          commandHtml: highlighter.codeToHtml(track.command, {
            lang: track.commandLanguage,
            theme,
          }),
          snippetHtml: highlighter.codeToHtml(track.snippet, {
            lang: track.snippetLanguage,
            theme,
          }),
        };
      }

      if (mounted) setHighlightedBlocks(output);
      highlighter.dispose();
    }

    void buildHighlightedBlocks();

    return () => {
      mounted = false;
    };
  }, [resolvedTheme]);

  const currentVersion =
    getUpdateProjectById('template-mod')?.currentVersion ?? '—';
  const templateHero = LANDING_HERO_COPY.templateMod;
  const versionLabelMd = interpolateHeroText(templateHero.versionLabelMd, {
    currentVersion,
  });
  const heroActions: HeroAction[] = templateHero.actions.map((action) => ({
    ...action,
    icon: HERO_ACTION_ICONS[action.id],
  }));

  return (
    <main
      className={cn(
        'relative min-h-screen text-foreground',
        '[--tm-accent:var(--suite-accent-light)] [--tm-primary:var(--suite-primary-light)] [--tm-secondary:var(--suite-secondary-light)] [--tm-text:var(--suite-text-light)] [--tm-text-inverted:var(--suite-text-inverted-light)]',
        'dark:[--tm-accent:var(--suite-accent-dark)] dark:[--tm-primary:var(--suite-primary-dark)] dark:[--tm-secondary:var(--suite-secondary-dark)] dark:[--tm-text:var(--suite-text-dark)] dark:[--tm-text-inverted:var(--suite-text-inverted-dark)]',
      )}
    >
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <motion.div
          className="absolute inset-0"
          style={{ scale: heroScale, y: heroY }}
        >
          <Image
            src="/images/shared/template-mod-light.png"
            alt=""
            fill
            priority
            className="object-cover blur-[6px] dark:hidden"
          />
          <Image
            src="/images/shared/template-mod-dark.png"
            alt=""
            fill
            priority
            className="hidden object-cover blur-[6px] dark:block"
          />
        </motion.div>
        <div className="absolute inset-0 bg-[#60A5FA]/6 dark:bg-[#93C5FD]/8" />
      </div>

      <section className="relative z-20 h-[calc(100svh-clamp(3.75rem,6vh,4.75rem))] overflow-hidden px-[clamp(0.85rem,3.5vw,2.4rem)] pt-[clamp(2.25rem,4.3vh,3.8rem)] pb-[clamp(0.45rem,1vh,0.85rem)] mb-[clamp(4rem,9vh,8.5rem)]">
        <div className="grid h-full w-full grid-rows-[minmax(0,1fr)_auto] gap-[clamp(0.4rem,1vh,0.75rem)] overflow-visible -translate-y-[clamp(0.6rem,1.8vh,1.5rem)]">
          <div className="relative z-30 flex min-h-0 items-center justify-center overflow-visible">
            <div className="relative z-30 flex w-full max-w-[min(92vw,50rem)] scale-[1.18] origin-center flex-col items-center text-center">
              <span
                className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide"
                style={{
                  borderColor: 'var(--tm-secondary)',
                  backgroundColor: 'var(--tm-primary)',
                  color: 'var(--tm-accent)',
                }}
              >
                <Tag className="size-3.5" aria-hidden="true" />
                <MarkdownText content={versionLabelMd} />
              </span>
              <h1 className="inline-flex items-center gap-3 text-[clamp(1.72rem,5.7vw,3.55rem)] font-black leading-[0.98] tracking-[-0.03em] max-[420px]:text-[clamp(1.5rem,5.7vw,2.05rem)]">
                <Package aria-hidden="true" className="size-[0.8em]" />
                <MarkdownText content={templateHero.titleMd} />
              </h1>

              <div className="mt-2 h-px w-[min(66vw,17rem)] bg-gradient-to-r from-transparent via-[var(--tm-accent)]/80 to-transparent" />

              <p className="mt-4 max-w-[36rem] text-pretty text-[clamp(0.98rem,min(2.2vw,2.4svh),1.14rem)] leading-[1.45] text-muted-foreground">
                <MarkdownText content={templateHero.descriptionMd} />
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                {heroActions.map((action) => (
                  <HomeLinkButton
                    key={action.id}
                    link={{
                      label: action.labelMd,
                      href: action.href,
                      icon: action.icon,
                      external: action.external,
                      variant: action.variant,
                      scheme: 'template-mod',
                      size: action.size,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionShell title="Developer Workbench">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-3">
            {TRACKS.map((track) => {
              const active = track.id === activeTrack.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setActiveTrackId(track.id)}
                  onMouseEnter={() => setActiveTrackId(track.id)}
                  onFocus={() => setActiveTrackId(track.id)}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-all duration-200',
                    active
                      ? 'border-[var(--tm-accent)] bg-[var(--tm-secondary)] shadow-md ring-1 ring-[var(--tm-primary)]'
                      : 'border-border bg-card/60 hover:border-border/80 hover:bg-card/80',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <LineBullet
                      icon={
                        <track.icon className="size-3.5" aria-hidden="true" />
                      }
                      colorRole="accentColor"
                      textRole="textColorInverted"
                      shape="circle"
                      size="sm"
                    />
                    <h3 className="text-base font-semibold text-foreground">
                      {track.title}
                    </h3>
                  </div>
                  <InlineMarkdown
                    content={track.description}
                    className="mt-2 text-sm leading-relaxed text-muted-foreground"
                  />
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card/80 p-4 sm:p-5 h-[34rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTrack.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="flex h-full flex-col justify-center gap-4"
              >
                <MdxStyleCodeBlock
                  title="terminal"
                  language={activeTrack.commandLanguage}
                  code={activeTrack.command}
                  html={activeTrackHtml?.commandHtml}
                />
                <MdxStyleCodeBlock
                  title={activeTrack.file}
                  language={activeTrack.snippetLanguage}
                  code={activeTrack.snippet}
                  html={activeTrackHtml?.snippetHtml}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </SectionShell>

      <SectionDivider />

      <SectionShell title="Built For Production Mods">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((capability) => {
            const active = activeCapabilityId === capability.id;
            return (
              <button
                key={capability.id}
                type="button"
                onClick={() => setActiveCapabilityId(capability.id)}
                onMouseEnter={() => setActiveCapabilityId(capability.id)}
                onFocus={() => setActiveCapabilityId(capability.id)}
                className={cn(
                  'flex h-full flex-col text-left p-5 rounded-xl border transition-all duration-200 outline-none',
                  active
                    ? 'border-[var(--tm-accent)] bg-[var(--tm-secondary)] shadow-md ring-1 ring-[var(--tm-primary)]'
                    : 'border-border bg-card/65 hover:border-border/80 hover:bg-accent/40',
                )}
              >
                <div className="mb-2 flex min-h-7 items-center gap-3">
                  <LineBullet
                    icon={
                      <capability.icon
                        className="size-3.5"
                        aria-hidden="true"
                      />
                    }
                    colorRole="accentColor"
                    textRole="textColorInverted"
                    shape="circle"
                    size="sm"
                    className={cn('shrink-0', !active && 'opacity-85')}
                  />
                  <h3 className="text-base font-semibold text-foreground">
                    {capability.title}
                  </h3>
                </div>
                <InlineMarkdown
                  content={capability.description}
                  className="pt-0.5 text-sm leading-relaxed text-muted-foreground"
                />
              </button>
            );
          })}
        </div>
      </SectionShell>

      <SectionDivider />

      <SectionShell title="Start Building">
        <div className="grid gap-4 sm:grid-cols-2">
          <ActionCard
            href="/template-mod/docs"
            title="Read Documentation"
            description="View the full Template Mod documentation and learn how to use it."
            icon={BookText}
            label="Documentation"
          />
          <ActionCard
            href="https://github.com/Subway-Builder-Modded/template-mod"
            external
            title="Clone Repository"
            description="Start from the official template and build your own mod."
            icon={GitPullRequestArrow}
            label="GitHub"
          />
        </div>
      </SectionShell>

      <div className="h-16" />
    </main>
  );
}

function MdxStyleCodeBlock({
  title,
  language,
  code,
  html,
}: {
  title: string;
  language: string;
  code: string;
  html?: string;
}) {
  return (
    <figure
      data-rehype-pretty-code-figure
      className="overflow-hidden rounded-lg border border-border/80 bg-background/90"
    >
      <figcaption className="border-b border-border/80 bg-muted/35 px-3 py-2 font-mono text-xs font-semibold text-muted-foreground">
        {title}
      </figcaption>
      {html ? (
        <div
          className="[&_.shiki]:!bg-transparent [&_.shiki]:m-0 [&_.shiki]:overflow-x-auto [&_.shiki]:p-4 [&_.shiki]:text-[13px] [&_.shiki]:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre
          data-language={language}
          className="overflow-x-auto p-4 text-[13px] leading-relaxed"
        >
          <code className={`language-${language}`}>{code}</code>
        </pre>
      )}
    </figure>
  );
}

function ActionCard({
  href,
  title,
  description,
  icon: Icon,
  label,
  external,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  label: string;
  external?: boolean;
}) {
  const className =
    'group rounded-xl border border-border bg-card/70 p-5 transition-all duration-200 hover:border-[var(--tm-accent)] hover:shadow-md hover:ring-1 hover:ring-[var(--tm-primary)]';

  const content = (
    <>
      <div className="flex items-center gap-3">
        <LineBullet
          icon={<Icon className="size-3.5" aria-hidden="true" />}
          colorRole="accentColor"
          textRole="textColorInverted"
          shape="circle"
          size="sm"
        />
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      <BlockMarkdown
        content={description}
        className="mt-3 text-sm leading-relaxed text-muted-foreground"
      />
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--tm-accent)]">
        {label}
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function InlineMarkdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return <MarkdownText content={content} className={className} />;
}

function BlockMarkdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <MarkdownText content={content} className={className} inline={false} />
  );
}
