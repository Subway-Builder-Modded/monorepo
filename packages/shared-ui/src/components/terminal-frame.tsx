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
        'overflow-hidden rounded-xl border border-border/60 bg-[#0d0d0d] shadow-2xl dark:bg-[#0a0a0a]',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        {title && (
          <span className="ml-3 text-[11px] font-medium text-white/30">
            {title}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

