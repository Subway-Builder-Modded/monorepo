import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../lib/cn';

export type TerminalFrameProps = {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  headerEnd?: ReactNode;
  hideWindowControls?: boolean;
  style?: CSSProperties;
  title?: string;
  titleClassName?: string;
};

export function TerminalFrame({
  bodyClassName,
  children,
  className,
  headerClassName,
  headerEnd,
  hideWindowControls = false,
  style,
  title,
  titleClassName,
}: TerminalFrameProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-black/[0.09] bg-[#f6f6f7] shadow-2xl dark:border-white/[0.08] dark:bg-[#0a0a0a]',
        className,
      )}
      style={style}
    >
      <div
        className={cn(
          'flex items-center gap-1.5 border-b border-black/[0.09] px-4 py-2.5 dark:border-white/[0.08]',
          headerClassName,
        )}
      >
        {!hideWindowControls ? (
          <>
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </>
        ) : null}
        {title && (
          <span
            className={cn(
              !hideWindowControls && 'ml-3',
              'text-[11px] font-medium text-black/45 dark:text-white/35',
              titleClassName,
            )}
          >
            {title}
          </span>
        )}
        {headerEnd ? <div className="ml-auto flex items-center">{headerEnd}</div> : null}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

