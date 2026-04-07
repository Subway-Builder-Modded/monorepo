'use client';

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MarkdownTextProps = {
  content: string;
  className?: string;
  inline?: boolean;
};

export function MarkdownText({
  content,
  className,
  inline = true,
}: MarkdownTextProps) {
  const markdown = (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <>{children}</>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => (
          <code className="rounded-sm bg-foreground/10 px-1 py-0.5 font-mono text-[0.92em]">
            {children}
          </code>
        ),
        u: ({ children }) => <u>{children}</u>,
      }}
    >
      {content}
    </Markdown>
  );

  if (inline) {
    return <span className={className}>{markdown}</span>;
  }

  return <div className={className}>{markdown}</div>;
}
