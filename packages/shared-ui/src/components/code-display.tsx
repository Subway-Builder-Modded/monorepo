import { useEffect, useState, type CSSProperties } from 'react';
import { cn } from '../lib/cn';
import { TerminalFrame } from './terminal-frame';

export type CodeDisplayProps = {
  code: string;
  lang?: string;
  title?: string;
  resolvedTheme?: string;
  className?: string;
  style?: CSSProperties;
};

function useShikiHighlight(code: string, lang: string, theme: string) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    async function highlight() {
      const { codeToHtml } = await import('shiki');
      const result = await codeToHtml(code, {
        lang,
        theme: theme === 'dark' ? 'github-dark-default' : 'github-light-default',
      });
      if (!cancelled) setHtml(result);
    }
    highlight();
    return () => {
      cancelled = true;
    };
  }, [code, lang, theme]);

  return html;
}

export function CodeDisplay({
  code,
  lang = 'typescript',
  title,
  resolvedTheme = 'dark',
  className,
  style,
}: CodeDisplayProps) {
  const highlighted = useShikiHighlight(code, lang, resolvedTheme);
  const lineCount = code.split('\n').length;

  return (
    <TerminalFrame title={title} className={className} style={style} bodyClassName="flex overflow-x-auto">
      <div
        className="flex flex-col items-end border-r border-black/[0.08] px-3 py-4 font-mono text-[13px] leading-6 text-black/42 select-none dark:border-white/[0.06] dark:text-white/26"
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
    </TerminalFrame>
  );
}
