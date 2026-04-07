import type * as React from 'react';
import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';
import Link from 'next/link';
import { CodeBlock } from '@/components/mdx/code-block';
import { cn } from '@/lib/utils';
import {
  slugify,
  textFromChildren,
  toDimension,
} from '@/components/mdx/platform/utils';

type MdxImageProps = Omit<
  React.ComponentProps<typeof Image>,
  'src' | 'alt' | 'width' | 'height'
> & {
  alt?: string;
  height?: number | string;
  src?: string;
  width?: number | string;
};

export function MdxImage({
  alt = '',
  fill,
  height,
  src,
  width,
  ...props
}: MdxImageProps) {
  if (!src) return null;

  const normalizedWidth = toDimension(width);
  const normalizedHeight = toDimension(height);

  if (fill || (normalizedWidth && normalizedHeight)) {
    return (
      <Image
        alt={alt}
        fill={fill}
        height={normalizedHeight}
        src={src}
        width={normalizedWidth}
        {...props}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      decoding="async"
      height={normalizedHeight}
      loading="lazy"
      src={src}
      width={normalizedWidth}
      {...(props as React.ImgHTMLAttributes<HTMLImageElement>)}
    />
  );
}

export function MdxLink({
  href = '',
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const linkClassName =
    'font-medium text-primary underline underline-offset-4 break-words [overflow-wrap:anywhere]';
  const isHash = href.startsWith('#');
  const isInternal = href.startsWith('/');
  const isExternal =
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:');

  if (isHash) {
    return (
      <a href={href} className={linkClassName} {...props}>
        {children}
      </a>
    );
  }

  if (isInternal) {
    return (
      <Link href={href} className={linkClassName} {...props}>
        {children}
      </Link>
    );
  }

  if (isExternal) {
    return (
      <a
        href={href}
        className={linkClassName}
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <a href={href} className={linkClassName} {...props}>
      {children}
    </a>
  );
}

export const mdxCoreComponents: MDXComponents = {
  Image: MdxImage,
  a: MdxLink,
  h1: ({ children, id, ...props }) => {
    const headingId = id ?? slugify(textFromChildren(children));
    return (
      <h1
        id={headingId}
        className="scroll-m-20 text-4xl font-black tracking-tight"
        {...props}
      >
        {children}
      </h1>
    );
  },
  h2: ({ children, id, ...props }) => {
    const headingId = id ?? slugify(textFromChildren(children));
    return (
      <h2
        id={headingId}
        className="mt-10 scroll-m-20 border-b border-border pb-2 text-3xl font-bold tracking-tight first:mt-0"
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3: ({ children, id, ...props }) => {
    const headingId = id ?? slugify(textFromChildren(children));
    return (
      <h3
        id={headingId}
        className="mt-8 scroll-m-20 text-2xl font-bold tracking-tight"
        {...props}
      >
        {children}
      </h3>
    );
  },
  h4: ({ children, id, ...props }) => {
    const headingId = id ?? slugify(textFromChildren(children));
    return (
      <h4
        id={headingId}
        className="mt-6 scroll-m-20 text-xl font-semibold tracking-tight"
        {...props}
      >
        {children}
      </h4>
    );
  },
  p: ({ className, ...props }) => (
    <p
      className={cn(
        'leading-7 break-words [overflow-wrap:anywhere] [&:not(:first-child)]:mt-6',
        className,
      )}
      {...props}
    />
  ),
  ul: (props) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />,
  ol: (props) => (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />
  ),
  li: (props) => (
    <li className="leading-7 break-words [overflow-wrap:anywhere]" {...props} />
  ),
  strong: (props) => <strong className="font-semibold" {...props} />,
  hr: (props) => <hr className="my-8 border-border" {...props} />,
  table: (props) => (
    <div className="my-6 w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  thead: (props) => <thead className="[&_tr]:border-b" {...props} />,
  tbody: (props) => <tbody className="[&_tr:last-child]:border-0" {...props} />,
  tr: (props) => <tr className="border-b transition-colors" {...props} />,
  th: (props) => (
    <th
      className="h-10 px-2 text-left align-middle font-medium text-foreground"
      {...props}
    />
  ),
  td: (props) => <td className="p-2 align-middle" {...props} />,
  code: ({ className, ...props }) => {
    if (className) {
      return <code className={className} {...props} />;
    }

    return (
      <code
        className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
        {...props}
      />
    );
  },
  pre: (props) => <CodeBlock {...props} />,
  blockquote: (props) => (
    <blockquote
      className="mt-6 border-l-2 pl-6 italic text-muted-foreground"
      {...props}
    />
  ),
};
