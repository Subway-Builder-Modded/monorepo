'use client';

import {
  Link as LinkPrimitive,
  type LinkProps as LinkPrimitiveProps,
} from 'react-aria-components';
import { cx } from '@/lib/primitive';

function isExternalHref(href?: LinkPrimitiveProps['href']) {
  return (
    typeof href === 'string' &&
    (href.startsWith('http://') || href.startsWith('https://'))
  );
}

export interface LinkProps extends LinkPrimitiveProps {
  ref?: React.RefObject<HTMLAnchorElement>;
}

export function Link({ className, ref, ...props }: LinkProps) {
  const shouldOpenInNewTab = isExternalHref(props.href);

  return (
    <LinkPrimitive
      ref={ref}
      target={props.target ?? (shouldOpenInNewTab ? '_blank' : undefined)}
      rel={
        props.rel ?? (shouldOpenInNewTab ? 'noopener noreferrer' : undefined)
      }
      className={cx(
        [
          'font-medium text-(--text)',
          'outline-0 outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring forced-colors:outline-[Highlight]',
          'disabled:cursor-default disabled:opacity-50 forced-colors:disabled:text-[GrayText]',
          'href' in props && 'cursor-pointer',
        ],
        className,
      )}
      {...props}
    />
  );
}
