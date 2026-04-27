import type { ComponentType, ImgHTMLAttributes, ReactNode } from "react";
import { LinkIcon } from "lucide-react";
import { slugify as defaultSlugify } from "../lib/slugify.ts";
import { cx } from "../lib/cx.ts";
import { CodeBlock } from "./code-block.tsx";
import { Tabs, TabItem, type IconResolver } from "./tabs.tsx";
import {
  Note,
  Tip,
  Important,
  Warning,
  Caution,
  Danger,
  InfoAdmonition,
  Success,
  Deprecated,
  Alert,
  Example,
  Announcement,
} from "./admonition.tsx";
import { Spoiler, MdxDetails, MdxSummary } from "./spoiler.tsx";

type MdxComponentMap = Record<string, ComponentType<any>>;

type InternalLinkProps = {
  to: string;
  className?: string;
  children: ReactNode;
  [key: string]: unknown;
};

type CreateArticleMdxComponentsOptions = {
  resolveIcon?: IconResolver;
  internalLinkComponent?: ComponentType<InternalLinkProps>;
  slugify?: (text: string) => string;
  additionalComponents?: MdxComponentMap;
};

function extractTextFromChildren(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (!children) return "";
  if (Array.isArray(children)) return children.map(extractTextFromChildren).join("");
  if (typeof children === "object" && children !== null && "props" in children) {
    return extractTextFromChildren(
      (children as { props: { children?: ReactNode } }).props.children,
    );
  }
  return "";
}

function createHeading(level: 2 | 3 | 4 | 5, slugify: (text: string) => string) {
  const Tag = `h${level}` as const;
  const sizeClass = {
    2: "text-3xl font-bold mt-10 mb-4 tracking-tight",
    3: "text-2xl font-semibold mt-7 mb-3 tracking-tight",
    4: "text-xl font-semibold mt-5 mb-2",
    5: "text-base font-medium mt-4 mb-1.5",
  }[level];

  function Heading({ children, id }: { children?: ReactNode; id?: string }) {
    const resolvedId = id ?? slugify(extractTextFromChildren(children));

    return (
      <Tag id={resolvedId} className={cx("group scroll-mt-24 text-foreground", sizeClass)}>
        <a
          href={`#${resolvedId}`}
          className="inline-flex items-center gap-2 no-underline hover:underline"
          aria-label={`Link to ${extractTextFromChildren(children)}`}
        >
          {children}
          <LinkIcon
            className="size-3.5 opacity-0 transition-opacity group-hover:opacity-50 group-focus-within:opacity-50"
            aria-hidden="true"
          />
        </a>
      </Tag>
    );
  }

  Heading.displayName = `H${level}`;
  return Heading;
}

function createMdxLink(InternalLinkComponent?: ComponentType<InternalLinkProps>) {
  return function MdxLink({
    href,
    children,
    ...props
  }: {
    href?: string;
    children?: ReactNode;
    [key: string]: unknown;
  }) {
    if (!href) return <span {...props}>{children}</span>;

    const isExternal = href.startsWith("http://") || href.startsWith("https://");

    if (isExternal || href.startsWith("#") || !InternalLinkComponent) {
      return (
        <a
          href={href}
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)] underline underline-offset-2 hover:opacity-80 transition-opacity"
          {...props}
        >
          {children}
        </a>
      );
    }

    return (
      <InternalLinkComponent
        to={href}
        className="text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)] underline underline-offset-2 hover:opacity-80 transition-opacity"
        {...props}
      >
        {children}
      </InternalLinkComponent>
    );
  };
}

function MdxImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      {...props}
      loading="lazy"
      className={cx("mx-auto my-4 max-w-full rounded-lg", props.className)}
    />
  );
}

function MdxPre({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  return <CodeBlock {...props}>{children}</CodeBlock>;
}

export function createArticleMdxComponents({
  resolveIcon,
  internalLinkComponent,
  slugify = defaultSlugify,
  additionalComponents,
}: CreateArticleMdxComponentsOptions = {}): MdxComponentMap {
  const MdxLink = createMdxLink(internalLinkComponent) as ComponentType<Record<string, unknown>>;

  const baseComponents: MdxComponentMap = {
    h2: createHeading(2, slugify),
    h3: createHeading(3, slugify),
    h4: createHeading(4, slugify),
    h5: createHeading(5, slugify),
    p: ({ children, ...props }) => (
      <p className="my-3 leading-relaxed text-foreground/90" {...props}>
        {children as ReactNode}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul
        className="my-3 ml-6 list-disc space-y-1 text-foreground/90 marker:text-muted-foreground"
        {...props}
      >
        {children as ReactNode}
      </ul>
    ),
    li: ({ children, ...props }) => (
      <li className="leading-relaxed" {...props}>
        {children as ReactNode}
      </li>
    ),
    strong: ({ children, ...props }) => (
      <strong className="font-semibold text-foreground" {...props}>
        {children as ReactNode}
      </strong>
    ),
    a: MdxLink,
    img: MdxImage as ComponentType<Record<string, unknown>>,
    Image: MdxImage as ComponentType<Record<string, unknown>>,
    pre: MdxPre as ComponentType<Record<string, unknown>>,
    code: ({ children, className, ...props }) => {
      if (className) {
        return (
          <code className={className as string} {...props}>
            {children as ReactNode}
          </code>
        );
      }

      return (
        <code
          className="rounded bg-muted px-1.5 py-0.5 text-[13px] font-mono text-foreground"
          {...props}
        >
          {children as ReactNode}
        </code>
      );
    },
    table: ({ children, ...props }) => (
      <div className="my-4 overflow-x-auto rounded-lg border border-border/50">
        <table className="w-full text-sm" {...props}>
          {children as ReactNode}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="border-b border-border/50 bg-muted/30" {...props}>
        {children as ReactNode}
      </thead>
    ),
    th: ({ children, ...props }) => (
      <th className="px-4 py-2.5 text-left font-semibold text-foreground" {...props}>
        {children as ReactNode}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="border-t border-border/30 px-4 py-2.5 text-foreground/85" {...props}>
        {children as ReactNode}
      </td>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="my-4 border-l-2 border-border/50 pl-4 text-foreground/70 italic"
        {...props}
      >
        {children as ReactNode}
      </blockquote>
    ),
    hr: () => (
      <hr className="my-8 border-0 border-t border-muted-foreground/20 dark:border-muted-foreground/35" />
    ),
    Spoiler: ((props: Record<string, unknown>) => (
      <Spoiler {...props} resolveIcon={resolveIcon} />
    )) as ComponentType<Record<string, unknown>>,
    details: MdxDetails as ComponentType<Record<string, unknown>>,
    summary: MdxSummary as ComponentType<Record<string, unknown>>,
    Note,
    Tip,
    Important,
    Warning,
    Caution,
    Danger,
    InfoAdmonition,
    Success,
    Deprecated,
    Alert,
    Example,
    Announcement,
    Tabs: ((props: Record<string, unknown>) => <Tabs {...props} resolveIcon={resolveIcon} />) as ComponentType<Record<string, unknown>>,
    TabItem: TabItem as ComponentType<Record<string, unknown>>,
  };

  return {
    ...baseComponents,
    ...(additionalComponents ?? {}),
  };
}
