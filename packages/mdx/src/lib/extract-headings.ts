import { slugify } from "./slugify.ts";

export type TocHeading = {
  id: string;
  text: string;
  level: number;
};

const HEADING_REGEX = /^(#{2,4})\s+(.+?)(?:\s+\{#([A-Za-z0-9._-]+)\})?$/gm;

/**
 * Parses raw markdown text and extracts h2–h4 headings with their IDs.
 * Explicit IDs via `{#custom-id}` syntax are respected; otherwise `slugify` is used.
 * Frontmatter (--- … ---) is stripped before scanning.
 */
export function extractHeadings(raw: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const content = raw.replace(/^---[\s\S]*?---\n?/, "");

  let match: RegExpExecArray | null;
  HEADING_REGEX.lastIndex = 0;

  while ((match = HEADING_REGEX.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const explicitId = match[3];

    headings.push({
      id: explicitId ?? slugify(text),
      text,
      level,
    });
  }

  return headings;
}
