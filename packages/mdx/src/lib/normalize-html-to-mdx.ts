const STYLE_ATTR_DOUBLE_QUOTE = /\sstyle\s*=\s*"[^"]*"/gi;
const STYLE_ATTR_SINGLE_QUOTE = /\sstyle\s*=\s*'[^']*'/gi;
const ALIGN_ATTR_DOUBLE_QUOTE = /\salign\s*=\s*"[^"]*"/gi;
const ALIGN_ATTR_SINGLE_QUOTE = /\salign\s*=\s*'[^']*'/gi;
const CLASS_ATTR = /\sclass\s*=/gi;
const FOR_ATTR = /\sfor\s*=/gi;
const VOID_HTML_TAG_OPEN =
  /<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\s[^<>]*?)?>/gi;
const HTML_TAG_TOKEN = /<\/?([a-zA-Z][a-zA-Z0-9-]*)(?=[\s>/])[^>]*>/g;
const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);
const BLOCK_TAG_ALTERNATION = [
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "Table",
  "Thead",
  "Tbody",
  "Tr",
  "Th",
  "Td",
  "Details",
  "Summary",
  "Blockquote",
  "ul",
  "ol",
  "li",
  "div",
  "section",
  "article",
  "pre",
  "hr",
].join("|");

const HTML_TAG_TO_MDX_COMPONENT: Array<[tag: string, component: string]> = [
  ["h1", "H1"],
  ["h2", "H2"],
  ["h3", "H3"],
  ["h4", "H4"],
  ["h5", "H5"],
  ["table", "Table"],
  ["thead", "Thead"],
  ["tbody", "Tbody"],
  ["tr", "Tr"],
  ["th", "Th"],
  ["td", "Td"],
  ["details", "Details"],
  ["summary", "Summary"],
  ["blockquote", "Blockquote"],
];

function remapTag(source: string, tag: string, component: string): string {
  const openingTag = new RegExp(`<${tag}(?=[\\s>/])`, "gi");
  const closingTag = new RegExp(`</${tag}(?=[\\s>])`, "gi");

  return source.replace(openingTag, `<${component}`).replace(closingTag, `</${component}`);
}

function normalizeVoidHtmlTags(source: string): string {
  return source.replace(VOID_HTML_TAG_OPEN, (fullMatch, tagName: string, attributes = "") => {
    const hasSelfClosingSlash = /\/\s*>$/.test(fullMatch);
    if (hasSelfClosingSlash) {
      return fullMatch;
    }

    return `<${tagName}${attributes} />`;
  });
}

function balanceHtmlTags(source: string): string {
  const stack: string[] = [];
  let output = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = HTML_TAG_TOKEN.exec(source)) !== null) {
    const rawTag = match[0];
    const tagName = (match[1] ?? "").toLowerCase();
    const tagStart = match.index;
    const tagEnd = tagStart + rawTag.length;
    const isClosingTag = rawTag.startsWith("</");
    const isSelfClosing = /\/\s*>$/.test(rawTag);

    output += source.slice(lastIndex, tagStart);

    if (isClosingTag) {
      const stackIndex = stack.lastIndexOf(tagName);
      if (stackIndex === -1) {
        lastIndex = tagEnd;
        continue;
      }

      for (let index = stack.length - 1; index > stackIndex; index -= 1) {
        output += `</${stack[index]}>`;
      }

      stack.length = stackIndex;
      output += rawTag;
      lastIndex = tagEnd;
      continue;
    }

    output += rawTag;

    if (!isSelfClosing && !VOID_TAGS.has(tagName)) {
      stack.push(tagName);
    }

    lastIndex = tagEnd;
  }

  output += source.slice(lastIndex);

  for (let index = stack.length - 1; index >= 0; index -= 1) {
    output += `</${stack[index]}>`;
  }

  return output;
}

function unwrapParagraphAroundBlockTags(source: string): string {
  const openWrappedBlock = new RegExp(`<p>(\\s*)(<(${BLOCK_TAG_ALTERNATION})(?=[\\s>/]))`, "gi");
  const closeWrappedBlock = new RegExp(
    `(</(${BLOCK_TAG_ALTERNATION})(?=[\\s>])>)(\\s*)</p>`,
    "gi",
  );

  return source.replace(openWrappedBlock, "$1$2").replace(closeWrappedBlock, "$1$3");
}

/**
 * Normalizes embedded HTML so it can be evaluated through MDX and routed
 * through our custom component map for consistent styling.
 */
export function normalizeHtmlToMdx(source: string): string {
  const normalizedAttributes = source
    .replace(STYLE_ATTR_DOUBLE_QUOTE, "")
    .replace(STYLE_ATTR_SINGLE_QUOTE, "")
    .replace(ALIGN_ATTR_DOUBLE_QUOTE, "")
    .replace(ALIGN_ATTR_SINGLE_QUOTE, "")
    .replace(CLASS_ATTR, " className=")
    .replace(FOR_ATTR, " htmlFor=");

  const normalizedVoidTags = normalizeVoidHtmlTags(normalizedAttributes);
  const balancedHtml = balanceHtmlTags(normalizedVoidTags);
  const mappedTags = HTML_TAG_TO_MDX_COMPONENT.reduce(
    (current, [tag, component]) => remapTag(current, tag, component),
    balancedHtml,
  );
  const balancedMappedTags = balanceHtmlTags(mappedTags);

  return unwrapParagraphAroundBlockTags(balancedMappedTags).replace(/<p>\s*<\/p>/gi, "");
}
