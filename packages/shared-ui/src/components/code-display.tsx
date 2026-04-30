'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

import { TerminalFrame } from './terminal-frame';

export type CodeDisplayTab = {
  id: string;
  label: string;
  icon?: ReactNode;
  code: string;
  lang?: string;
  title?: string;
};

type CodeDisplaySharedProps = {
  resolvedTheme?: string;
  className?: string;
  style?: CSSProperties;
};

type CodeDisplaySingleProps = CodeDisplaySharedProps & {
  code: string;
  lang?: string;
  title?: string;
  tabs?: never;
  defaultTabId?: never;
  activeTabId?: never;
  onActiveTabChange?: never;
  tabsAriaLabel?: never;
};

type CodeDisplayTabbedProps = CodeDisplaySharedProps & {
  tabs: CodeDisplayTab[];
  code?: never;
  lang?: never;
  title?: never;
  defaultTabId?: string;
  activeTabId?: string;
  onActiveTabChange?: (tabId: string) => void;
  tabsAriaLabel?: string;
};

export type CodeDisplayProps = CodeDisplaySingleProps | CodeDisplayTabbedProps;

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function highlightLog(code: string): string {
  const lines = code.split('\n');
  const highlighted = lines
    .map((line) => {
      const isComment = line.trimStart().startsWith('#');
      if (isComment) {
        return `<span style="color:#6b7280;">${escapeHtml(line)}</span>`;
      }
      return escapeHtml(line);
    })
    .join('\n');

  return `<pre class="shiki" style="background-color:transparent"><code>${highlighted}</code></pre>`;
}

async function highlightOne(code: string, lang: string, theme: string): Promise<string> {
  if (lang === 'log') return highlightLog(code);
  const { codeToHtml } = await import('shiki');
  return codeToHtml(code, {
    lang,
    theme: theme === 'dark' ? 'github-dark-default' : 'github-light-default',
  });
}

/** Pre-highlights all entries up front; returns a map of key → html. */
function useAllHighlighted(
  entries: { key: string; code: string; lang: string }[],
  theme: string,
): Record<string, string> {
  const [cache, setCache] = useState<Record<string, string>>({});

  // Stable serialised key so the effect only re-fires when content actually changes.
  const entriesKey = entries.map((e) => `${e.key}:${e.lang}:${e.code}`).join('||');

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const results = await Promise.all(
        entries.map(async (e) => ({ key: e.key, html: await highlightOne(e.code, e.lang, theme) })),
      );
      if (!cancelled) {
        const next: Record<string, string> = {};
        for (const r of results) next[r.key] = r.html;
        setCache(next);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entriesKey, theme]);

  return cache;
}

export function CodeDisplay({
  resolvedTheme = 'dark',
  className,
  style,
  ...props
}: CodeDisplayProps) {
  const isTabbed = 'tabs' in props;
  const tabs = isTabbed ? props.tabs : undefined;
  const firstTab = tabs?.[0];
  const initialTabId =
    tabs && tabs.length > 0
      ? tabs.some((tab) => tab.id === props.defaultTabId)
        ? props.defaultTabId!
        : firstTab!.id
      : undefined;

  const [internalActiveTabId, setInternalActiveTabId] = useState<string | undefined>(initialTabId);
  const activeTabId = isTabbed ? props.activeTabId ?? internalActiveTabId : undefined;

  useEffect(() => {
    if (!isTabbed || !tabs?.length) {
      return;
    }

    const hasActive = activeTabId ? tabs.some((tab) => tab.id === activeTabId) : false;
    if (!hasActive) {
      const fallbackId = tabs[0]!.id;
      if (props.activeTabId === undefined) {
        setInternalActiveTabId(fallbackId);
      }
      props.onActiveTabChange?.(fallbackId);
    }
  }, [isTabbed, tabs, activeTabId, props]);

  const activeTab = tabs?.find((tab) => tab.id === activeTabId) ?? firstTab;

  const code = isTabbed ? activeTab?.code ?? '' : props.code;
  const lang = isTabbed ? activeTab?.lang ?? 'typescript' : props.lang ?? 'typescript';
  const title = isTabbed ? activeTab?.title : props.title;

  // Pre-highlight all tabs (or the single code block) so switching is instant.
  const highlightEntries = isTabbed
    ? (tabs ?? []).map((t) => ({ key: t.id, code: t.code, lang: t.lang ?? 'typescript' }))
    : [{ key: '__single__', code: props.code, lang: props.lang ?? 'typescript' }];
  const highlightCache = useAllHighlighted(highlightEntries, resolvedTheme);
  const highlighted = isTabbed
    ? (activeTab ? highlightCache[activeTab.id] : undefined) ?? ''
    : highlightCache['__single__'] ?? '';
  const lineCount = code.split('\n').length;
  const maxLineCount = tabs?.reduce((max, tab) => Math.max(max, tab.code.split('\n').length), lineCount) ?? lineCount;
  const gutterDigits = Math.max(2, String(maxLineCount).length);

  return (
    <TerminalFrame
      title={title}
      className={className}
      style={style}
      bodyClassName="flex overflow-x-auto"
    >
      <div
        className="flex flex-col items-end border-r border-black/[0.08] px-3 py-4 font-mono text-[13px] leading-6 text-black/42 select-none dark:border-white/[0.06] dark:text-white/26"
        style={{ width: `calc(${gutterDigits}ch + 1.5rem)` }}
        aria-hidden="true"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <span key={i} className="block h-6 tabular-nums">
            {i + 1}
          </span>
        ))}
      </div>
      {highlighted ? (
        <div
          className="min-w-0 flex-1 overflow-x-auto p-4 font-mono text-[13px] leading-6 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      ) : (
        <div className="flex-1 p-4">
          <pre className="font-mono text-[13px] leading-6 text-black/72 dark:text-white/44">
            {code}
          </pre>
        </div>
      )}
      {tabs && tabs.length > 0 ? (
        <div
          role="tablist"
          aria-label={props.tabsAriaLabel ?? 'Code variants'}
          className="flex shrink-0 flex-col gap-2 border-l border-black/[0.08] bg-transparent px-2 py-2 dark:border-white/[0.06]"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab?.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                onClick={() => {
                  if (props.activeTabId === undefined) {
                    setInternalActiveTabId(tab.id);
                  }
                  props.onActiveTabChange?.(tab.id);
                }}
                className={[
                  'inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,currentColor_25%,transparent)]',
                  isActive
                    ? '!border-[color-mix(in_srgb,var(--suite-accent-light)_45%,transparent)] !bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,white)] !text-[var(--suite-accent-light)] dark:!border-[color-mix(in_srgb,var(--suite-accent-dark)_50%,transparent)] dark:!bg-[color-mix(in_srgb,var(--suite-accent-dark)_18%,transparent)] dark:!text-[var(--suite-accent-dark)]'
                    : 'border-transparent bg-transparent text-black/56 hover:!border-[color-mix(in_srgb,var(--suite-accent-light)_32%,transparent)] hover:!bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,white)] hover:!text-[var(--suite-accent-light)] dark:text-white/52 dark:hover:!border-[color-mix(in_srgb,var(--suite-accent-dark)_36%,transparent)] dark:hover:!bg-[color-mix(in_srgb,var(--suite-accent-dark)_14%,transparent)] dark:hover:!text-[var(--suite-accent-dark)]',
                ].join(' ')}
              >
                {tab.icon ?? <span className="text-[10px] font-semibold">{tab.label.slice(0, 1)}</span>}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </TerminalFrame>
  );
}
