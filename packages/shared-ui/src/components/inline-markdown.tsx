import type { JSX, ReactNode } from "react";

type Segment =
  | { kind: "text"; value: string }
  | { kind: "bold"; value: string }
  | { kind: "italic"; value: string }
  | { kind: "strike"; value: string }
  | { kind: "bold-italic"; value: string };

// Parses a flat string into styled segments.
// Supported syntax: **bold**, *italic*, _italic_, ~~strikethrough~~
// Bold-italic (***text***) is handled as a combined segment.
function parse(input: string): Segment[] {
  const segments: Segment[] = [];
  // Order matters — longer tokens first to avoid partial matches.
  const pattern = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|~~(.+?)~~|\*(.+?)\*|_(.+?)_)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > cursor) {
      segments.push({ kind: "text", value: input.slice(cursor, match.index) });
    }

    if (match[2] !== undefined) {
      segments.push({ kind: "bold-italic", value: match[2] });
    } else if (match[3] !== undefined) {
      segments.push({ kind: "bold", value: match[3] });
    } else if (match[4] !== undefined) {
      segments.push({ kind: "strike", value: match[4] });
    } else if (match[5] !== undefined || match[6] !== undefined) {
      segments.push({ kind: "italic", value: (match[5] ?? match[6])! });
    }

    cursor = match.index + match[0].length;
  }

  if (cursor < input.length) {
    segments.push({ kind: "text", value: input.slice(cursor) });
  }

  return segments;
}

function renderSegment(seg: Segment, i: number): ReactNode {
  switch (seg.kind) {
    case "bold":
      return <strong key={i}>{seg.value}</strong>;
    case "italic":
      return <em key={i}>{seg.value}</em>;
    case "strike":
      return <s key={i}>{seg.value}</s>;
    case "bold-italic":
      return (
        <strong key={i}>
          <em>{seg.value}</em>
        </strong>
      );
    default:
      return seg.value;
  }
}

export interface InlineMarkdownProps {
  /** String with optional **bold**, *italic*, _italic_, and ~~strikethrough~~ markup. */
  children: string;
  /** Wrapping element. Defaults to a React fragment (no wrapper). */
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

/**
 * Renders a string with inline markdown — bold, italic, and strikethrough —
 * as native HTML elements. No external parser dependency.
 *
 * Supported syntax:
 * - `**bold**`
 * - `*italic*` or `_italic_`
 * - `~~strikethrough~~`
 * - `***bold italic***`
 */
export function InlineMarkdown({ children, as: Tag, className }: InlineMarkdownProps) {
  const segments = parse(children);
  const rendered = segments.map(renderSegment);

  if (Tag) {
    return <Tag className={className}>{rendered}</Tag>;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{rendered}</>;
}
