import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type TerminalFrameProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export function TerminalFrame({
  title,
  children,
  className,
}: TerminalFrameProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-black/[0.09] bg-[#f6f6f7] shadow-2xl dark:border-white/[0.08] dark:bg-[#0a0a0a]',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-black/[0.09] px-4 py-2.5 dark:border-white/[0.08]">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        {title && (
          <span className="ml-3 text-[11px] font-medium text-black/45 dark:text-white/35">
            {title}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

