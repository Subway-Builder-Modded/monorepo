import type { Code } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const HIGHLIGHT_RANGE_PATTERN = /\{([\d,\s-]+)\}/;
const HIGHLIGHT_ATTR_PATTERN =
  /(?:^|\s)(?:highlight|highlightLines|lines)=(?:"([^"]+)"|'([^']+)'|([^\s]+))/;
const TITLE_ATTR_PATTERN = /(?:^|\s)title=(?:"([^"]+)"|'([^']+)'|([^\s]+))/;

function pickAttribute(match: RegExpMatchArray | null) {
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function normalizeHighlightSpec(raw: string | null) {
  return raw?.replace(/[{}]/g, "").trim() || null;
}

export const remarkCodeBlockMeta: Plugin = () => {
  return (tree) => {
    visit(tree, "code", (node: Code) => {
      if (!node.meta) return;

      const highlightSpec = normalizeHighlightSpec(
        pickAttribute(node.meta.match(HIGHLIGHT_ATTR_PATTERN)) ??
          pickAttribute(node.meta.match(HIGHLIGHT_RANGE_PATTERN)),
      );
      const title = pickAttribute(node.meta.match(TITLE_ATTR_PATTERN));

      if (!highlightSpec && !title) return;

      const data = (node.data ??= {});
      const hProperties = ((data.hProperties ??= {}) as Record<string, unknown>);

      if (highlightSpec) {
        hProperties["data-highlight-lines"] = highlightSpec;
      }

      if (title) {
        hProperties.title = title;
      }
    });
  };
};
