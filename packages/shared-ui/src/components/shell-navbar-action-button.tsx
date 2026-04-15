import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export const SHELL_NAVBAR_ACTION_CLASS =
  'inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * Generic icon-sized action button for shell navbar action areas.
 * Styled as a round pill with muted foreground and hover-to-foreground transition.
 */
export function ShellNavbarActionButton({
  className,
  ...props
}: ComponentProps<'button'>) {
  return <button {...props} className={cn(SHELL_NAVBAR_ACTION_CLASS, className)} />;
}

/**
 * Generic icon-sized action link for shell navbar action areas.
 * Styled identically to ShellNavbarActionButton but renders as an anchor.
 */
export function ShellNavbarActionLink({
  className,
  ...props
}: ComponentProps<'a'>) {
  return <a {...props} className={cn(SHELL_NAVBAR_ACTION_CLASS, className)} />;
}
