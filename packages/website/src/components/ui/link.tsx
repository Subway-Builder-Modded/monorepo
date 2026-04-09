'use client';

import NextLink from 'next/link';
import { forwardRef, type AnchorHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

function isExternalHref(href?: string) {
  return (
    typeof href === 'string' &&
    (href.startsWith('http://') || href.startsWith('https://'))
  );
}

function isHashHref(href?: string) {
  return typeof href === 'string' && href.startsWith('#');
}

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { className, href, rel, target, ...props },
  ref,
) {
  const shouldOpenInNewTab = isExternalHref(href);
  const mergedClassName = twMerge(
    'font-medium text-(--text)',
    'outline-0 outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring forced-colors:outline-[Highlight]',
    'disabled:cursor-default disabled:opacity-50 forced-colors:disabled:text-[GrayText]',
    href && 'cursor-pointer',
    className,
  );

  if (shouldOpenInNewTab || isHashHref(href)) {
    return (
      <a
        ref={ref}
        href={href}
        target={target ?? (shouldOpenInNewTab ? '_blank' : undefined)}
        rel={rel ?? (shouldOpenInNewTab ? 'noopener noreferrer' : undefined)}
        className={mergedClassName}
        {...props}
      />
    );
  }

  return (
    <NextLink
      ref={ref}
      href={href}
      target={target}
      rel={rel}
      className={mergedClassName}
      {...props}
    />
  );
});
