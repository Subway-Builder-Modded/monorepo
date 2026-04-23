import type { ReactNode, ImgHTMLAttributes } from "react";
import { Link } from "@/lib/router";
import { slugify } from "@/features/docs/lib";
import { cn } from "@/lib/utils";
import { LinkIcon } from "lucide-react";
import { CodeBlock } from "./code-block";
import { Tabs, TabItem } from "./tabs";
import { Directory } from "./directory";
import { RegionTags } from "./region-tags";
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
} from "./admonition";
import { Spoiler, MdxDetails, MdxSummary } from "./spoiler";

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

function createHeading(level: 2 | 3 | 4 | 5) {
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
      <Tag id={resolvedId} className={cn("group scroll-mt-24 text-foreground", sizeClass)}>
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

function MdxLink({
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

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)] underline underline-offset-2 hover:opacity-80 transition-opacity"
        {...props}
      >
        {children}
      </a>
    );
  }

  // Same-page fragment links must stay as plain <a> so the browser scrolls
  // instead of the client-side router treating them as a page navigation.
  if (href.startsWith("#")) {
    return (
      <a
        href={href}
        className="text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)] underline underline-offset-2 hover:opacity-80 transition-opacity"
        {...props}
      >
        {children}
      </a>
    );
  }

  // Fix old absolute links
  const fixedHref = href.startsWith("https://subwaybuildermodded.com")
    ? href.replace("https://subwaybuildermodded.com", "")
    : href;

  return (
    <Link
      to={fixedHref}
      className="text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)] underline underline-offset-2 hover:opacity-80 transition-opacity"
      {...props}
    >
      {children}
    </Link>
  );
}

function MdxImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      {...props}
      loading="lazy"
      className={cn("mx-auto my-4 max-w-full rounded-lg", props.className)}
    />
  );
}

function MdxPre({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  return <CodeBlock {...props}>{children}</CodeBlock>;
}

export const mdxComponents: Record<string, React.ComponentType<any>> = {
  // Headings with autolinks
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),

  // Prose elements
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
  ol: ({ children, ...props }) => (
    <ol
      className="my-3 ml-6 list-decimal space-y-1 text-foreground/90 marker:text-muted-foreground"
      {...props}
    >
      {children as ReactNode}
    </ol>
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

  // Links and images
  a: MdxLink as React.ComponentType<Record<string, unknown>>,
  img: MdxImage as React.ComponentType<Record<string, unknown>>,
  Image: MdxImage as React.ComponentType<Record<string, unknown>>,

  // Code
  pre: MdxPre as React.ComponentType<Record<string, unknown>>,
  code: ({ children, className, ...props }) => {
    if (className) {
      // Syntax highlighted code inside pre — passthrough
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

  // Table
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
    <td className="px-4 py-2.5 text-foreground/85 border-t border-border/30" {...props}>
      {children as ReactNode}
    </td>
  ),

  // Blockquote
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-4 border-l-2 border-border/50 pl-4 text-foreground/70 italic"
      {...props}
    >
      {children as ReactNode}
    </blockquote>
  ),

  // Horizontal rule
  hr: () => (
    <hr className="my-8 border-0 border-t border-muted-foreground/20 dark:border-muted-foreground/35" />
  ),

  // Spoiler/details components
  Spoiler: Spoiler as React.ComponentType<Record<string, unknown>>,
  details: MdxDetails as React.ComponentType<Record<string, unknown>>,
  summary: MdxSummary as React.ComponentType<Record<string, unknown>>,

  // Admonitions
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

  // Tabs
  Tabs: Tabs as React.ComponentType<Record<string, unknown>>,
  TabItem: TabItem as React.ComponentType<Record<string, unknown>>,

  // Interactive components
  Directory: Directory as React.ComponentType<Record<string, unknown>>,
  RegionTags: RegionTags as React.ComponentType<Record<string, unknown>>,
} as Record<string, React.ComponentType<any>>;
