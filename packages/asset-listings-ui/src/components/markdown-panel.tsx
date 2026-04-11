import { cn } from '@subway-builder-modded/shared-ui';
import type React from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export interface MarkdownPanelProps {
  markdown: string;
  className?: string;
  proseClassName?: string;
  linkTarget?: string;
  linkRel?: string;
  onLinkClick?: (
    href: string,
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => void;
}

const DEFAULT_PROSE_CLASS_NAME =
  'prose prose-sm prose-neutral max-w-none text-sm leading-relaxed dark:prose-invert';

export function MarkdownPanel({
  markdown,
  className,
  proseClassName,
  linkTarget = '_blank',
  linkRel = 'noopener noreferrer',
  onLinkClick,
}: MarkdownPanelProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <div className={cn(DEFAULT_PROSE_CLASS_NAME, proseClassName)}>
        <Markdown
          rehypePlugins={[rehypeRaw]}
          components={{
            a: ({ href, children, ...props }) => (
              <a
                {...props}
                href={href}
                target={onLinkClick ? undefined : linkTarget}
                rel={onLinkClick ? undefined : linkRel}
                onClick={(event) => {
                  if (href && onLinkClick) {
                    event.preventDefault();
                    onLinkClick(href, event);
                  }
                }}
              >
                {children}
              </a>
            ),
          }}
        >
          {markdown}
        </Markdown>
      </div>
    </div>
  );
}
