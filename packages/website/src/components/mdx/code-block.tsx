'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

type CodeBlockProps = React.ComponentProps<'pre'>;

export function CodeBlock({ className, children, ...props }: CodeBlockProps) {
  const preRef = React.useRef<HTMLPreElement | null>(null);
  const [copied, setCopied] = React.useState(false);

  const onCopy = React.useCallback(async () => {
    const source = preRef.current;
    if (!source) return;

    const text = source.textContent ?? '';
    if (!text.trim()) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }, []);

  return (
    <div className="group/code-block relative my-6">
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        className={cn(
          'absolute top-2 right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/70 bg-background/80 text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity',
          'hover:bg-accent/60 hover:text-foreground',
          'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
          'group-hover/code-block:opacity-100 group-focus-within/code-block:opacity-100',
        )}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>

      <pre
        ref={preRef}
        className={cn(
          'overflow-x-auto rounded-xl border bg-muted p-4 pr-14 text-sm',
          className,
        )}
        {...props}
      >
        {children}
      </pre>
    </div>
  );
}
