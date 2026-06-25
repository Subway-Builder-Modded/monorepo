import { useMemo } from "react";

const HTML_HEADING_START = "__SBM_HEADING_START__";
const HTML_HEADING_END = "__SBM_HEADING_END__";

export type DescriptionSegment = {
  text: string;
  bold?: boolean;
};

function stripHtml(input: string): string {
  if (typeof DOMParser === "undefined") {
    return input.replace(/<[^>]*>/g, " ");
  }

  const parsed = new DOMParser().parseFromString(input, "text/html");
  return parsed.body.textContent ?? "";
}

function stripHtmlWithDescriptionMarkers(input: string): string {
  const markedInput = input
    .replace(/<h[1-6]\b[^>]*>/gi, `\n${HTML_HEADING_START}`)
    .replace(/<\/h[1-6]>/gi, `${HTML_HEADING_END}\n`)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(
      /<\/?(p|div|section|article|blockquote|li|ul|ol|pre|table|thead|tbody|tfoot|tr|td|th)\b[^>]*>/gi,
      "\n",
    );

  return stripHtml(markedInput);
}

function stripMarkdown(input: string): string {
  return input
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s{0,3}\d+\.\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\|/g, " ");
}

function normalizeDescriptionLine(input: string): DescriptionSegment | null {
  const isHtmlHeading = input.includes(HTML_HEADING_START) || input.includes(HTML_HEADING_END);
  const withoutHtmlMarkers = input
    .replaceAll(HTML_HEADING_START, "")
    .replaceAll(HTML_HEADING_END, "");
  const headingMatch = withoutHtmlMarkers.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
  const isHeading = isHtmlHeading || Boolean(headingMatch);
  const lineContent = headingMatch ? headingMatch[2] : withoutHtmlMarkers;
  const normalized = stripMarkdown(lineContent).replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  return {
    text: normalized,
    bold: isHeading,
  };
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function normalizeDescriptionSegments(input: string): DescriptionSegment[] {
  const normalizedInput = /<[^>]+>/.test(input) ? stripHtmlWithDescriptionMarkers(input) : input;
  const lines = normalizedInput.split(/\r?\n+/);
  const segments: DescriptionSegment[] = [];

  for (const line of lines) {
    const normalized = normalizeDescriptionLine(line);
    if (!normalized) {
      continue;
    }
    segments.push(normalized);
  }

  return segments;
}

function truncateDescriptionSegments(
  segments: DescriptionSegment[],
  maxLength: number,
): DescriptionSegment[] {
  const result: DescriptionSegment[] = [];
  let usedLength = 0;

  for (const segment of segments) {
    const prefix = result.length > 0 ? " " : "";
    const available = maxLength - usedLength - prefix.length;

    if (available <= 0) {
      break;
    }

    if (segment.text.length <= available) {
      result.push({ ...segment, text: `${prefix}${segment.text}` });
      usedLength += prefix.length + segment.text.length;
      continue;
    }

    const truncatedText = truncate(segment.text, available);
    if (truncatedText) {
      result.push({ ...segment, text: `${prefix}${truncatedText}` });
    }
    break;
  }

  return result;
}

export function useDescriptionPreview(
  description: string,
  maxLength: number,
): DescriptionSegment[] {
  return useMemo(() => {
    const normalizedSegments = normalizeDescriptionSegments(description);
    return truncateDescriptionSegments(normalizedSegments, maxLength);
  }, [description, maxLength]);
}
