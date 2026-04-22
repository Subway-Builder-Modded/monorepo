import type { Plugin } from "unified";
import type { Root } from "mdast";

function isFrontmatterNode(node: Root["children"][number]): boolean {
  if (node.type === "yaml") {
    return true;
  }

  return (node as { type?: string }).type === "toml";
}

export const remarkStripFrontmatter: Plugin<[], Root> = () => {
  return (tree: Root) => {
    tree.children = tree.children.filter((node) => !isFrontmatterNode(node));
  };
};
