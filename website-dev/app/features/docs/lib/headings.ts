import type { DocsTocHeading } from "./types";

const HEADING_REGEX = /^(#{2,4})\s+(.+?)(?:\s+\{#([a-z0-9-]+)\})?$/gm;

export function extractHeadings(raw: string): DocsTocHeading[] {
  const headings: DocsTocHeading[] = [];

  // Strip frontmatter
  const content = raw.replace(/^---[\s\S]*?---\n?/, "");

  let match: RegExpExecArray | null;
  HEADING_REGEX.lastIndex = 0;

  while ((match = HEADING_REGEX.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const explicitId = match[3];

    const id = explicitId ?? slugify(text);

    headings.push({ id, text, level });
  }

  return headings;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
