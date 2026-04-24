import type { Root, Heading, PhrasingContent } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const HEADING_ID_PATTERN = /\s*\{#([A-Za-z0-9._-]+)\}\s*$/;

export const remarkHeadingIds: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, "heading", (node: Heading) => {
      const lastChild = node.children[node.children.length - 1];
      if (!lastChild || lastChild.type !== "text") return;

      const match = lastChild.value.match(HEADING_ID_PATTERN);
      if (!match) return;

      const id = match[1];
      lastChild.value = lastChild.value.replace(HEADING_ID_PATTERN, "");

      if (lastChild.value === "") {
        node.children = node.children.slice(0, -1) as PhrasingContent[];
      }

      const data = node.data ?? (node.data = {});
      const hProperties = (data.hProperties ?? (data.hProperties = {})) as Record<string, string>;
      hProperties.id = id;
    });
  };
};
