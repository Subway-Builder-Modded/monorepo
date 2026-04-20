/**
 * Remark plugin that extracts static heading IDs from `{#some-id}` syntax
 * and sets them as `data.hProperties.id` on the heading node.
 *
 * This MUST run before @mdx-js/rollup compilation, because MDX interprets
 * `{...}` as JSX expressions and will fail on `{#id}`.
 *
 * Syntax: `## My Heading {#my-heading}`
 * Result: heading node with id="my-heading" and text "My Heading"
 */
import type { Root, Heading, PhrasingContent } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const HEADING_ID_PATTERN = /\s*\{#([a-z0-9][a-z0-9-]*)\}\s*$/;

export const remarkHeadingIds: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, "heading", (node: Heading) => {
      const lastChild = node.children[node.children.length - 1];
      if (!lastChild || lastChild.type !== "text") return;

      const match = lastChild.value.match(HEADING_ID_PATTERN);
      if (!match) return;

      const id = match[1];

      // Strip the {#id} from the text
      lastChild.value = lastChild.value.replace(HEADING_ID_PATTERN, "");

      // Remove empty text nodes
      if (lastChild.value === "") {
        node.children = node.children.slice(0, -1) as PhrasingContent[];
      }

      // Set the id via hProperties so it ends up on the rendered element
      const data = node.data ?? (node.data = {});
      const hProperties = (data.hProperties ?? (data.hProperties = {})) as Record<string, string>;
      hProperties.id = id;
    });
  };
};
