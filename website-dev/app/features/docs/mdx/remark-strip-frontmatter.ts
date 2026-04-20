import type { Plugin } from "unified";
import type { Root } from "mdast";

export const remarkStripFrontmatter: Plugin<[], Root> = () => {
  return (tree: Root) => {
    tree.children = tree.children.filter(
      (node) => node.type !== "yaml" && node.type !== "toml",
    );
  };
};
