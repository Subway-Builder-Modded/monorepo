const STYLE_ATTR_DOUBLE_QUOTE = /\sstyle\s*=\s*"[^"]*"/gi;
const STYLE_ATTR_SINGLE_QUOTE = /\sstyle\s*=\s*'[^']*'/gi;
const ALIGN_ATTR_DOUBLE_QUOTE = /\salign\s*=\s*"[^"]*"/gi;
const ALIGN_ATTR_SINGLE_QUOTE = /\salign\s*=\s*'[^']*'/gi;
const CLASS_ATTR = /\sclass\s*=/gi;
const FOR_ATTR = /\sfor\s*=/gi;

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

  return HTML_TAG_TO_MDX_COMPONENT.reduce(
    (current, [tag, component]) => remapTag(current, tag, component),
    normalizedAttributes,
  );
}