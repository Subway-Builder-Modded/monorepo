import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export const SIDE_RAIL_CHROME_CLASS =
  'rounded-2xl border-2 border-[color-mix(in_srgb,var(--suite-accent-light)_22%,var(--border))] bg-background/92 shadow-[0_10px_24px_-16px_rgba(0,0,0,0.35)] backdrop-blur-md';

export function SideRailShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('sticky top-20 self-start', SIDE_RAIL_CHROME_CLASS, className)}>{children}</div>;
}

export function SideRailHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <header className={cn('px-3 py-3', className)}>{children}</header>;
}

export function SideRailDivider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-border/55', className)} aria-hidden='true' />;
}

export function SideRailBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-2.5 py-3', className)}>{children}</div>;
}

export function SideRailUtilityButton({
  children,
  className,
  ...props
}: React.ComponentProps<'button'>) {
  return (
    <button
      type='button'
      className={cn(
        'inline-flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-colors',
        'hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,transparent)] hover:text-[var(--suite-accent-light)]',
        'dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_14%,transparent)] dark:hover:text-[var(--suite-accent-dark)]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}